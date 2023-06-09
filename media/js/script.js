document.getElementById("myForm").addEventListener("submit", handleSubmit);

function handleSubmit(event) {
  event.preventDefault();
  var apiKeyInput = document.getElementById("api-key");
  var apiKey = apiKeyInput.value.trim();
  if (apiKey !== "") {
    var apiKey = document.getElementById("api-key").value;
    var form = document.getElementById("myForm");
    var message = document.getElementById("message");
    var searchItem = document.getElementById("search-output");
    searchItem.classList.remove("hidden");
    message.classList.add("hidden");
    form.classList.add("hidden");
    document.getElementById("myForm").reset();
  } else {
    var messageElement = document.getElementById("message");
    messageElement.textContent = "Please enter an API key.";
  }
}