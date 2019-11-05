// 检查data是否为空或空对象或空数组
export function checkData(data) {
    if (data === undefined || data === null || data === '') {
      return false;
    } else if (JSON.stringify(data) === '{}') {
      return false;
    } else if (data.length === 0) {
      return false;
    } else {
      return true;
    }
}