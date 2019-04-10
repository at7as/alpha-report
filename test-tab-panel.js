
function initReport() {
    let panelConfig = {
        widget: $widget,
        period: $dashboard.getWidget('w_es3iuaoypo5g4k0cjm3pet'),
        map: {
            'Месяц': 'Отчетный период',
            'Нарастающий итог': 'Отчетный период',
            'Квартал': 'Отчетный период квартал',
            'Полугодие': 'Отчетный период полугодие'
        }
    }
    let panel = new OCRVreport(panelConfig);
    panel.init();
}
function waitReport() { if (typeof OCRVreport !== 'undefined') { initReport(); } else { setTimeout(function () { waitReport(); }, 1000); } }
waitReport();
