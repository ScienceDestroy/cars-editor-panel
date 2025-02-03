import { Vehicle } from './types';

export const parseVehiclesLua = (content: string): Vehicle[] => {
  try {
    // First, check if the content is empty
    if (!content.trim()) {
      throw new Error("File is empty");
    }

    // Try to find the Vehicles table in different possible formats
    const vehiclesMatch = content.match(/local\s+Vehicles\s*=\s*{([\s\S]+?)}\s*(?:$|(?:for|return))/);

    if (!vehiclesMatch) {
      throw new Error("Could not find vehicles table in the file");
    }

    const vehiclesStr = vehiclesMatch[1];
    
    // Split into individual vehicle entries using a more robust pattern
    const vehicleEntries = vehiclesStr
      .split(/}\s*,\s*{/)
      .map(entry => entry.replace(/^\s*{/, '').replace(/}\s*$/, ''))
      .filter(entry => entry.trim());
    
    if (vehicleEntries.length === 0) {
      throw new Error("No vehicle entries found in the file");
    }

    return vehicleEntries
      .map(entry => {
        try {
          const modelMatch = entry.match(/\['model'\]\s*=\s*'([^']+)'/);
          const nameMatch = entry.match(/\['name'\]\s*=\s*'([^']+)'/);
          const brandMatch = entry.match(/\['brand'\]\s*=\s*'([^']+)'/);
          const priceMatch = entry.match(/\['price'\]\s*=\s*(\d+)/);
          const categoryLabelMatch = entry.match(/\['categoryLabel'\]\s*=\s*'([^']+)'/);
          const shopMatch = entry.match(/\['shop'\]\s*=\s*'([^']+)'/);

          if (!modelMatch || !nameMatch || !brandMatch || !priceMatch || !categoryLabelMatch || !shopMatch) {
            console.warn('Skipping invalid vehicle entry:', entry);
            return null;
          }

          return {
            model: modelMatch[1].trim(),
            name: nameMatch[1].trim(),
            brand: brandMatch[1].trim(),
            price: parseInt(priceMatch[1]),
            categoryLabel: categoryLabelMatch[1].trim(),
            shop: shopMatch[1].trim()
          };
        } catch (err) {
          console.warn('Error parsing vehicle entry:', err);
          return null;
        }
      })
      .filter((v): v is Vehicle => v !== null);
  } catch (error) {
    console.error('Error parsing vehicles.lua:', error);
    throw error;
  }
};

export const generateVehiclesLua = (vehicles: Vehicle[]): string => {
  const vehiclesStr = vehicles
    .map(vehicle => `    {
        ['model'] = '${vehicle.model}',
        ['name'] = '${vehicle.name}',
        ['brand'] = '${vehicle.brand}',
        ['price'] = ${vehicle.price},
        ['categoryLabel'] = '${vehicle.categoryLabel}',
        ['shop'] = '${vehicle.shop}',
    }`)
    .join(',\n');

  return `QBShared = QBShared or {}
QBShared.Vehicles = QBShared.Vehicles or {}

local Vehicles = {
${vehiclesStr}
}

for i = 1, #Vehicles do
    QBShared.Vehicles[Vehicles[i].model] = {
        spawncode = Vehicles[i].model,
        name = Vehicles[i].name,
        brand = Vehicles[i].brand,
        model = Vehicles[i].model,
        price = Vehicles[i].price,
        category = Vehicles[i].categoryLabel:gsub("%s+", ""):lower(),
        categoryLabel = Vehicles[i].categoryLabel,
        hash = joaat(Vehicles[i].model),
        shop = Vehicles[i].shop
    }
end

return QBShared.Vehicles`;
}