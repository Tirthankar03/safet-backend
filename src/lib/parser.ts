
 export function parseFormData (data: Record<string, unknown>): Record<string, any> {
    const parsedData: Record<string, any> = {};
  
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== 'string') {
        parsedData[key] = value;
        continue;
      }
  
      let parsedValue: any = value.trim(); // Remove leading/trailing whitespace
  
      try {
        // Attempt to parse the value as JSON
        parsedValue = JSON.parse(parsedValue);
      } catch (error) {
        // If parsing fails, check if it's an array of objects string
        if (parsedValue.startsWith('[{') && parsedValue.endsWith('}]')) {
          try {
            // Replace single quotes with double quotes and parse
            parsedValue = JSON.parse(parsedValue.replace(/'/g, '"'));
          } catch (innerError) {
            // If parsing still fails, keep the original trimmed value
          }
        }
        // Otherwise, keep the original trimmed value
      }
  
      // Convert string "true" or "false" to boolean
      if (parsedValue === "true") parsedValue = true;
      if (parsedValue === "false") parsedValue = false;
  
      // Convert string numbers to actual numbers
      // if (typeof parsedValue === "string" && !isNaN(parsedValue as unknown as number) && parsedValue.trim() !== "") {
      //   parsedValue = Number(parsedValue);
      // }
  
      parsedData[key] = parsedValue;
    }
  
    return parsedData;
}