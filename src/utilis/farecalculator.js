// Simple fare calculation based on distance (km)
exports.calculateFare = (distanceKm) => {
  const baseFare = 500; // base cost (₦)
  const perKmRate = 150; // cost per km (₦)
  
  const fare = baseFare + distanceKm * perKmRate;
  return Math.round(fare);
};
