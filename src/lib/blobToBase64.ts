/**
 * Function to convert a Blob object into a Base64-encoded string
 * @param {Blob} blob
 * @param {((base64data: string | undefined) => void)} callback
 */
const blobToBase64 = (
  blob: Blob, // The Blob object to be converted
  callback: (base64data: string | undefined) => void, // Callback function to handle the Base64 string result
): void => {
  const reader = new FileReader() // Create a new FileReader instance

  // Define what happens when the FileReader has completed reading the Blob
  reader.onload = function () {
    // Convert the result to a string, split by the comma, and take the second part (the actual Base64 data)
    const base64data = reader.result?.toString().split(",")[1]

    // Invoke the callback function with the Base64 data
    callback(base64data)
  }

  // readAsDataURL() It is used to read the contents of a Blob or
  // File object and encode it as a base64-encoded string, which
  // is then represented as a Data URL.
  reader.readAsDataURL(blob)
}

export { blobToBase64 }
