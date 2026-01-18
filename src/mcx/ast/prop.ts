
/**
 * 解析属性字符串，如 "xxx = yyyy"，返回. {xxx: yyy}
 * @param input 输入字符串，格式如 "xxx = yyyy"
 * @returns 包含解析后属性的 Record<string, string>
 */
const parseProp = (input: string): Record<string, string> => {
  const result: Record<string, string> = {};
  
  // 去除前后空格
  const trimmedInput = input.trim();
  
  // 如果没有等号，整个字符串作为键，值为 "true"
  if (!trimmedInput.includes('=')) {
    result[trimmedInput] = "true";
    return result;
  }
  
  // 分割键值对
  const equalsIndex = trimmedInput.indexOf('=');
  const key = trimmedInput.substring(0, equalsIndex).trim();
  let value = trimmedInput.substring(equalsIndex + 1).trim();
  
  // 处理引号包裹的值
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  
  result[key] = value;
  return result;
};

export default parseProp;