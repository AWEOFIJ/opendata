$(function () {
    $("#progressBar").progressbar({
        value: 0 // Initial value
    });

    // Simulate progress
    let progress = 0;
    const interval = setInterval(function () {
        progress += 10;
        $("#progressbar").progressbar("option", "value", progress);
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 500);
});