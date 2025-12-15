/**
 * Downloads the given data as a JSON file with the specified file name.
 *
 * @param data - The data to be downloaded as JSON.
 * @param fileName - The name of the downloaded file.
 * @returns An Error object if an error occurs during the download, otherwise null.
 */
export function downloadAsJson(data: object, fileName: string): Error | null {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return null;
  } catch (error) {
    return error as Error;
  }
}
