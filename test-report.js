
function initReport() {
    let reportConfig = {
        widget: $widget,
        sourceName: 'Месяц',
        vars: ['month', 'year', 'prevyear'],
        h1: 'Среднесписочная численность, фонд заработной платы, среднемесячная заработная плата (вкл.067КВВ)',
        h2: '(фактические данные)*',
        header: [
            [
                { r: 3, n: '№ п.п.' },
                { r: 3, n: 'Наименование подразделения' },
                { c: 12, n: 'во всех видах деятельности' }
            ],
            [
                { c: 4, n: 'Среднесписочная численность, чел.' },
                { c: 4, n: 'Фонд заработной платы, тыс.руб.' },
                { c: 4, n: 'Среднемесячная заработная плата, руб.' }
            ],
            [
                { n: 'за <%month%> <%prevyear%>' },
                { n: 'за <%month%> <%year%>' },
                { n: '% т.г. к пр.г.' },
                { n: '+, - т.г. к пр.г.' },
                { n: 'за <%month%> <%prevyear%>' },
                { n: 'за <%month%> <%year%>' },
                { n: '% т.г. к пр.г.' },
                { n: '+, - т.г. к пр.г.' },
                { n: 'за <%month%> <%prevyear%>' },
                { n: 'за <%month%> <%year%>' },
                { n: '% т.г. к пр.г.' },
                { n: '+, - т.г. к пр.г.' }
            ],
            [
                { n: '&nbsp;', s: 'thead-bottom thead-small' },
                { n: '1', s: 'thead-bottom thead-small' },
                { n: '2', s: 'thead-bottom thead-small' },
                { n: '3', s: 'thead-bottom thead-small' },
                { n: '4', s: 'thead-bottom thead-small' },
                { n: '5', s: 'thead-bottom thead-small' },
                { n: '6', s: 'thead-bottom thead-small' },
                { n: '7', s: 'thead-bottom thead-small' },
                { n: '8', s: 'thead-bottom thead-small' },
                { n: '9', s: 'thead-bottom thead-small' },
                { n: '10', s: 'thead-bottom thead-small' },
                { n: '11', s: 'thead-bottom thead-small' },
                { n: '12', s: 'thead-bottom thead-small' },
                { n: '13', s: 'thead-bottom thead-small' }
            ]
        ],
        footer: [
            '* формируется на основе фактических данных показателей внутренних статистических отчетов ф.1-т(УТО-1), 1-т(ОАО "РЖД").',
            'цветом выделяется в случаях:',
            '- ССЧ больше 100%',
            '- ФЗП больше 120% или меньше 90%',
            '- СМЗП больше 120% или меньше 100%'
        ],
        values: [
            {},
            {},
            {},
            {
                format: {
                    v: { a: -1 },
                    f: function (v) { return v.a > 100 },
                    s: 'color: rgb(150,50,50)'
                }
            },
            {},
            {},
            {},
            {
                format: {
                    v: { a: -1 },
                    f: function (v) { return v.a > 120 || v.a < 90 },
                    s: 'color: rgb(150,50,50)'
                }
            },
            {},
            {},
            {},
            {
                format: {
                    v: { a: -1 },
                    f: function (v) { return v.a > 120 || v.a < 100 },
                    s: 'color: rgb(150,50,50)'
                }
            }
        ],
        numerable: true,
        colors: {
            first: [191, 197, 206],
            last: [217, 217, 217],
            bottom: [255, 255, 255]
        }
    }
    let report = new OCRVreport(reportConfig);
    report.init();
}
function waitReport() { if (typeof OCRVreport !== 'undefined') { initReport(); } else { setTimeout(function () { waitReport(); }, 1000); } }
waitReport();
