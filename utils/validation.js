/**
 * Validates incoming location payload
 * Constraints:
 * - lat: number between -90 and 90
 * - lng: number between -180 and 180
 * - accuracy: positive number > 0
 */
function validateLocationInput(data) {
  if (!data || typeof data !== 'object') {
    return 'Dữ liệu không hợp lệ (cần JSON object).';
  }

  const { lat, lng, accuracy, name } = data;

  if (name !== undefined && typeof name !== 'string') {
    return 'Họ tên người tham dự không hợp lệ.';
  }

  if (typeof lat !== 'number' || Number.isNaN(lat) || lat < -90 || lat > 90) {
    return 'Vĩ độ (lat) phải là số thực trong khoảng [-90, 90].';
  }

  if (typeof lng !== 'number' || Number.isNaN(lng) || lng < -180 || lng > 180) {
    return 'Kinh độ (lng) phải là số thực trong khoảng [-180, 180].';
  }

  if (typeof accuracy !== 'number' || Number.isNaN(accuracy) || accuracy <= 0) {
    return 'Độ chính xác (accuracy) phải là số dương lớn hơn 0.';
  }

  return null;
}

module.exports = { validateLocationInput };
