// JavaScript for MP3 File Uploader

// Function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]); // Remove metadata prefix
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

// Event listener for the upload form
$(document).ready(() => {
    $("#uploadForm").on("submit", async function (event) {
        event.preventDefault();

        const fileInput = $("#fileInput")[0].files[0];
        if (!fileInput) {
            alert("Please select a file to upload.");
            return;
        }

        if (fileInput.type !== "audio/mpeg") {
            alert("Only MP3 files are allowed.");
            return;
        }

        try {
            // Convert file to base64
            const base64File = await fileToBase64(fileInput);

            // Prepare the payload
            const payload = {
                fileName: fileInput.name,
                fileContent: base64File,
                contentType: fileInput.type,
            };

            // Send to Logic App
            const response = await fetch("https://prod-34.eastus.logic.azure.com/workflows/965e09fb2eb344e8bb8e5f3c0e16d553/triggers/When_a_HTTP_request_is_received/paths/invoke/api/audio/upload?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=TYprWTaHM8Lpu9FcRkmpHuHbMlLmc114t4PoeIreGmA", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to upload file.");
            }

            alert("File uploaded successfully.");

            // Reload the uploaded files
            loadUploadedFiles();
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Error uploading file. Check the console for details.");
        }
    });

    // Load uploaded files on page load
    loadUploadedFiles();
});

// Function to fetch and display uploaded files
async function loadUploadedFiles() {
    try {
        const response = await fetch("YOUR_LOGIC_APP_GET_URL");
        if (!response.ok) {
            throw new Error("Failed to fetch uploaded files.");
        }

        const files = await response.json();
        const fileList = $("#uploadedFiles");
        fileList.empty();

        files.forEach((file) => {
            const listItem = `
                <li class="list-group-item">
                    <strong>${file.fileName}</strong>
                    <audio controls class="mt-2">
                        <source src="${file.blobUrl}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </li>
            `;
            fileList.append(listItem);
        });
    } catch (error) {
        console.error("Error fetching uploaded files:", error);
        alert("Error loading uploaded files. Check the console for details.");
    }
}
