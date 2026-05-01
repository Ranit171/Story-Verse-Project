window.addEventListener('error', function(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.zIndex = '999999';
    errorDiv.style.backgroundColor = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.fontSize = '20px';
    errorDiv.innerHTML = '<pre>' + event.error?.stack + '</pre>';
    document.body.appendChild(errorDiv);
});
