// Function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]); // Remove metadata prefix
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById("uploadForm");
    const fileInput = document.getElementById("fileInput");
    const uploadedFilesList = document.getElementById("uploadedFiles");

    // Logic App URLs
    const uploadLogicAppUrl = "https://prod-34.eastus.logic.azure.com:443/workflows/965e09fb2eb344e8bb8e5f3c0e16d553/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=TYprWTaHM8Lpu9FcRkmpHuHbMlLmc114t4PoeIreGmA";
    const retrieveLogicAppUrl = "https://prod-36.eastus.logic.azure.com:443/workflows/93203ea0b40e4153be2814fcec5ed88e/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=BNh7_mpooPQAyffOci-Yh7Bzduutw0_RqiG4QpCAFwA";
    const deleteLogicAppUrl = "https://prod-36.eastus.logic.azure.com:443/workflows/your-delete-logic-app-url"; // Replace with the actual DELETE Logic App URL

    // Handle form submission for file upload
    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }

        if (file.type !== "audio/mpeg") {
            alert("Only MP3 files are allowed.");
            return;
        }

        try {
            // Convert file to base64
            const base64File = await fileToBase64(file);

            // Prepare the payload
            const payload = {
                fileName: file.name,
                fileContent: base64File,
                contentType: file.type,
                metadata: {
                    uploader: "Anonymous",
                    description: "Uploaded via frontend"
                }
            };

            // Send payload to Logic App
            const response = await fetch(uploadLogicAppUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to upload file.");
            }

            alert(`File "${file.name}" uploaded successfully!`);
            loadUploadedFiles(); // Refresh file list
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Error uploading file. Check the console for details.");
        }
    });

    // Function to fetch and display uploaded files
    async function loadUploadedFiles() {
        try {
            const response = await fetch(retrieveLogicAppUrl);

            if (!response.ok) {
                throw new Error("Failed to fetch uploaded files.");
            }

            const files = await response.json();
            uploadedFilesList.innerHTML = ""; // Clear the list

            files.forEach((file) => {
                const listItem = document.createElement("li");
                listItem.className = "list-group-item d-flex justify-content-between align-items-center";

                // Add file details
                listItem.innerHTML = `
                    <div>
                        <strong>${file.fileName}</strong>
                        <audio controls class="mt-2">
                            <source src="${file.blobUrl}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                `;

                // Create delete button
                const deleteButton = document.createElement("button");
                deleteButton.className = "btn btn-danger";
                deleteButton.textContent = "Delete";

                // Add click event to delete the file
                deleteButton.addEventListener("click", async () => {
                    try {
                        const deleteResponse = await fetch(deleteLogicAppUrl, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ fileName: file.fileName }),
                        });

                        if (!deleteResponse.ok) {
                            throw new Error("Failed to delete the file.");
                        }

                        alert(`File "${file.fileName}" deleted successfully!`);
                        loadUploadedFiles(); // Refresh the file list
                    } catch (error) {
                        console.error("Error deleting file:", error);
                        alert("Error deleting the file. Check the console for details.");
                    }
                });

                listItem.appendChild(deleteButton); // Add delete button to list item
                uploadedFilesList.appendChild(listItem); // Add list item to DOM
            });
        } catch (error) {
            console.error("Error loading uploaded files:", error);
            alert("Error loading uploaded files. Check the console for details.");
        }
    }

    // Load uploaded files on page load
    loadUploadedFiles();
});


