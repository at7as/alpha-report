
if (typeof OCRVreport === 'undefined') {
    let script = document.createElement('script');
    script.src = 'https://at7as.github.io/alpha-report/alpha-report.js';
    document.head.appendChild(script);
    let style = document.createElement('link');
    style.href = 'https://at7as.github.io/alpha-report/alpha-report.css';
    style.type = 'text/css';
    style.rel = 'stylesheet';
    document.head.appendChild(style);
}
