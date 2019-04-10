
function initReport() {
    let panelConfig = {
        widget: $widget,
        period: $dashboard.getWidget('w_wn1t8enpsd4hg4n1qwmmf'),
        dashboard: $dashboard,
        map: {
            'Месяц': 'Отчетный период',
            'Нарастающий итог': 'Отчетный период',
            'Квартал': 'Отчетный период квартал',
            'Полугодие': 'Отчетный период полугодие'
        }
    }
    let panel = new OCRVtabpanel(panelConfig);
    panel.init();
}
function waitReport() { if (typeof OCRVreport !== 'undefined') { initReport(); } else { setTimeout(function () { waitReport(); }, 1000); } }
waitReport();
