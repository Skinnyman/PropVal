/**
 * Normalizes raw row data from Google Sheets into MarketData schema format
 * @param {Array} rows - Array of objects (from PapaParse or similar)
 * @param {String} category - The category of the data
 * @returns {Array} - Normalized entries
 */
const normalizeMarketData = (data, category) => {
  return data.map(row => {
    // Create a lowercase, no-spaces version of the keys for matching
    const normalizedRow = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      normalizedRow[cleanKey] = row[key];
    });

    // Based on the selected category, extract the specific fields
    // Common fields
    const newObj = {
      region: normalizedRow.region || '',
      city: normalizedRow.city || normalizedRow.town || '',
      area: normalizedRow.area || normalizedRow.suburb || '',
      propertyType: normalizedRow.propertytype || normalizedRow.type || normalizedRow.category || '',
      source: normalizedRow.source || normalizedRow.reference || '',
      notes: normalizedRow.notes || normalizedRow.comments || ''
    };

    if (category === 'Sale Transactions') {
      newObj.price = normalizedRow.price || normalizedRow.saleprice || normalizedRow.value || '';
      newObj.saleDate = normalizedRow.saledate || normalizedRow.date || '';
      newObj.landSize = normalizedRow.landsize || normalizedRow.plot || '';
      newObj.buildingSize = normalizedRow.buildingsize || normalizedRow.gfa || '';
    } else if (category === 'Land Values') {
      newObj.price = normalizedRow.price || normalizedRow.value || '';
      newObj.landSize = normalizedRow.landsize || normalizedRow.size || '';
      newObj.zoning = normalizedRow.zoning || normalizedRow.landuse || '';
      newObj.tenure = normalizedRow.tenure || normalizedRow.tenuretype || '';
    } else if (category === 'Rental Evidence') {
      newObj.landSize = normalizedRow.landsize || normalizedRow.plot || '';
      newObj.buildingSize = normalizedRow.buildingsize || normalizedRow.gfa || '';
      newObj.yearBuilt = normalizedRow.yearbuilt || normalizedRow.year || '';
      newObj.rent = normalizedRow.rent || normalizedRow.price || '';
      newObj.rentBasis = normalizedRow.rentbasis || normalizedRow.basis || '';
      newObj.occupancy = normalizedRow.occupancy || normalizedRow.occupancyrate || '';
    } else if (category === 'Construction Costs') {
      newObj.cost = normalizedRow.cost || normalizedRow.totalcost || normalizedRow.price || '';
      newObj.gfa = normalizedRow.gfa || normalizedRow.area || '';
      newObj.spec = normalizedRow.spec || normalizedRow.specification || '';
      newObj.completionDate = normalizedRow.completiondate || normalizedRow.date || '';
    } else if (category === 'Building Materials' || category === 'Fittings & Fixtures') {
      newObj.materialName = normalizedRow.materialname || normalizedRow.material || normalizedRow.name || '';
      newObj.materialPrice = normalizedRow.materialprice || normalizedRow.price || '';
      newObj.materialUnit = normalizedRow.materialunit || normalizedRow.unit || '';
      newObj.supplier = normalizedRow.supplier || normalizedRow.source || '';
    } else if (category === 'Cap Rates / Yields') {
      newObj.capRate = normalizedRow.caprate || normalizedRow.yield || '';
      newObj.annualRent = normalizedRow.annualrent || normalizedRow.rent || '';
      newObj.propertyValue = normalizedRow.propertyvalue || normalizedRow.value || '';
      newObj.leaseType = normalizedRow.leasetype || normalizedRow.lease || '';
    }
    return newObj;
  });
};

module.exports = {
  normalizeMarketData
};
