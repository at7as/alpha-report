
class OCRVparser {
    constructor(config) {
        this.source = config.source;
    }
    month() {
        let value = this.getValue('Отчётный период');
        return value ? value[3].substr(0, value[3].length - 5) : '';
    }
    year() {
        let value = this.getValue('Отчётный период');
        return value ? value[2] : '';
    }
    prevyear() {
        let value = this.getValue('Отчётный период');
        return value ? (parseInt(value[2]) - 1).toString(10) : '';
    }
    getValue(varName) {
        let varObject = this.source.model.query.variables[varName];
        if (varObject) {
            let varValue = (varObject.hasOwnProperty('value') ? varObject.value : varObject.defaultValue.value);
            return varValue.replace(/[[\]]/g, '').split('.');
        } else {
            return '';
        }
    }
};

class OCRVreport {
    constructor(config) {
        this.sourceName = config.sourceName;
        this.widget = config.widget;
        this.id = config.widget.itemId;
        this.vars = config.vars;
        this.header = config.header;
        this.footer = config.footer;
        this.values = config.values;
        this.numerable = config.numerable;
        this.colors = config.colors;
        this.h1 = config.h1 || '';
        this.h2 = config.h2;
        this.source = {};
        this.varParser = {};
        this.levels = 0;
        this.html = { head: '', body: '', style: '' };
        this.container = {};
        this.unrolled = true;
        this.update = this.update.bind(this);
        this.beforeUpdate = this.beforeUpdate.bind(this);
        this.export = this.export.bind(this);
        this.cancel = this.cancel.bind(this);
        this.run = this.run.bind(this);
        this.unroll = this.unroll.bind(this);
        this.unrollall = this.unrollall.bind(this);
    }
    init() {
        this.source = this.widget.getDataSource(this.sourceName);
        this.varParser = new OCRVparser({ source: this.source });
        this.source.model.on('beforeload', this.beforeUpdate);
        this.source.on('dataloaded', this.update);
        this.source.on('dataerror', this.cancel);
        this.drawBlank();
    }
    beforeUpdate() {
        this.widget.setLoading(true);
    }
    update() {
        this.drawHead();
        this.drawBody();
        this.drawStyle();
        this.applyTable();
        this.widget.setLoading(false);
    }
    cancel() {
        this.widget.setLoading(false);
    }
    run() {
        if (this.varParser.getValue('Отчётный период').length < 4) return;
        this.source.model.query.update(true);
    }
    drawBlank() {
        let html = '<br/><br/><div><button id="' + this.id + '-ocrv-report-export">Экспорт</button><button id="' + this.id + '-ocrv-report-run">Сформировать</button></div>';
        html += '<br/>';
        html += '<div id="' + this.id + '-ocrv-report-header" class="ocrv-report-header">';
        html += '<span class="ocrv-h1">' + this.h1 + '</span>';
        if (this.h2) html += '<br/><br/><span class="ocrv-h2">' + this.h2 + '</span>';
        html += '</div><br />';
        html += '<div id="' + this.id + '-ocrv-report-container"></div>';
        html += '<div id="' + this.id + '-ocrv-report-footer" class="ocrv-report-footer">';
        for (let r = 0; r < this.footer.length; r++) {
            html += this.footer[r] + (r < this.footer.length - 1 ? '<br/>' : '');
        }
        html += '</div>';
        this.widget.setWidgetHtml(html);
        this.container = document.getElementById(this.id + '-ocrv-report-container');
        document.getElementById(this.id + '-ocrv-report-export').onclick = this.export;
        document.getElementById(this.id + '-ocrv-report-run').onclick = this.run;
    }
    drawHead() {
        let vars = {};
        for (let v = 0; v < this.vars.length; v++) vars[this.vars[v]] = this.varParser[this.vars[v]]();
        this.html.head = '<thead>';
        for (let tr = 0; tr < this.header.length; tr++) {
            this.html.head += '<tr>';
            for (let th = 0; th < this.header[tr].length; th++) {
                let el = this.header[tr][th];
                let elp = {
                    r: (el.hasOwnProperty('r') ? ' rowspan="' + el.r + '"' : ''),
                    c: (el.hasOwnProperty('c') ? ' colspan="' + el.c + '"' : ''),
                    n: this.temple(el.n, vars),
                    u: (el.hasOwnProperty('u') ? ' id="' + this.id + '-ocrv-report-unroll" class="ocrv-report-unroll"' : '')
                };
                this.html.head += '<th' + elp.r + elp.c + elp.u + '>' + elp.n + '</th>'
            }
            this.html.head += '</tr>';
        }
        this.html.head += '</thead>';
    }
    drawBody() {
        this.levels = 0;
        this.unrolled = true;
        let result = this.source.model.lastResult;
        let parents = [];
        this.html.body = '<tbody>';
        for (let r = 0; r < result.rows.length; r++) {
            let row = result.rows[r];
            parents[parseInt(row.members[0]['LNum'])] = r;
            this.html.body += '<tr data-ocrv-id="ocrv-row-' + r + '" ';
            if (r > 0) {
                this.html.body += 'data-ocrv-parent="ocrv-row-' + parents[parseInt(row.members[0]['LNum']) - 1] + '" ';
            }
            if (r < result.rows.length - 1 && parseInt(result.rows[r + 1].members[0]['LNum']) > parseInt(row.members[0]['LNum'])) {
                if (row.members[0]['LNum'] == '0') {
                    this.html.body += 'class="ocrv-row-level-' + row.members[0]['LNum'] + '"';
                } else {
                    this.html.body += 'class="ocrv-row-roll ocrv-row-level-' + row.members[0]['LNum'] + ' ocrv-row-click"';
                }
            } else {
                this.html.body += 'class="ocrv-row-roll ocrv-row-level-bottom"';
            }
            this.html.body += '>';
            this.levels = Math.max(parseInt(row.members[0]['LNum']), this.levels);
            if (this.numerable) this.html.body += '<td>' + (r + 1) + '</td>';
            for (let d = 0; d < row.members.length; d++) {
                this.html.body += '<td class="ocrv-item-level-' + row.members[d]['LNum'] + '">';
                this.html.body += row.members[d]['Caption'];
                this.html.body += '</td>';
            }
            for (let v = 0; v < this.values; v++) {
                this.html.body += '<td class="ocrv-row-value">';
                if (result._ordinalCells.hasOwnProperty(r * this.values + v)) {
                    this.html.body += result._ordinalCells[r * this.values + v]['FmtValue'];
                } else {
                    this.html.body += '&nbsp;';
                }
                this.html.body += '</td>';
            }
            this.html.body += '</tr>';
        }
        this.html.body += '</tbody>';
    }
    drawStyle() {
        this.html.style = '<style>';
        if (this.levels > 1) {
            for (let l = 0; l < this.levels; l++) {
                this.html.style += (l == 0 ? '' : ' ') + '.ocrv-row-level-' + l + ' {background: rgb(';
                this.html.style += Math.ceil(this.colors.first[0] + (this.colors.last[0] - this.colors.first[0]) * (l / (this.levels - 1))) + ', '
                this.html.style += Math.ceil(this.colors.first[1] + (this.colors.last[1] - this.colors.first[1]) * (l / (this.levels - 1))) + ', '
                this.html.style += Math.ceil(this.colors.first[2] + (this.colors.last[2] - this.colors.first[2]) * (l / (this.levels - 1)))
                this.html.style += ')}' + (l == this.levels - 1 ? '' : ' ')
            }
        } else {
            this.html.style += '.ocrv-row-level-0 {background: rgb(' + this.colors.first[0] + ', ' + this.colors.first[0] + ', ' + this.colors.first[0] + ')}';
        }
        this.html.style += ' .ocrv-row-level-bottom {background: rgb(' + this.colors.bottom[0] + ', ' + this.colors.bottom[1] + ', ' + this.colors.bottom[2] + ')}';
        this.html.style += '</style>';
    }
    applyTable() {
        this.container.innerHTML = this.html.style + '<table class="ocrv-report-table">' + this.html.head + this.html.body + '</table>';
        let rows = this.container.getElementsByClassName('ocrv-row-click');
        for (let r = 0; r < rows.length; r++) rows[r].onclick = this.unroll;
        document.getElementById(this.id + '-ocrv-report-unroll').onclick = this.unrollall;
        this.unrollall();


        /*
        $('.ocrv-row-level-1').each(function (i, tr) { $(tr).click(); });
        $('#ocrv-unroll').click(function (e) {
            if (!$(e.currentTarget).hasClass('ocrv-unroll')) {
                $('#ocrv-report-container .ocrv-report-table .ocrv-row-click').each(function (i, tr) {
                    if ($(tr).hasClass('ocrv-row-hide-children')) $(tr).click();
                });
                $(e.currentTarget).addClass('ocrv-unroll')
            } else {
                $('#ocrv-report-container .ocrv-report-table .ocrv-row-click').each(function (i, tr) {
                    if (!$(tr).hasClass('ocrv-row-hide-children')) $(tr).click();
                });
                $(e.currentTarget).removeClass('ocrv-unroll')
            }
        });
*/
    }
    unroll(e) {
        let t = e.target;
        if (t.tagName == 'TD') t = t.parentElement;
        let id = t.getAttribute('data-ocrv-id');
        let rows = this.container.querySelectorAll('tr[data-ocrv-parent="' + id + '"]');
        if (t.classList.contains('ocrv-row-hide-children')) {
            for (let r = 0; r < rows.length; r++) rows[r].classList.remove('ocrv-row-hide-self');
            t.classList.remove('ocrv-row-hide-children');
        } else {
            for (let r = 0; r < rows.length; r++) {
                let row = rows[r];
                row.classList.add('ocrv-row-hide-self');
                if (row.classList.contains('ocrv-row-click') && !row.classList.contains('ocrv-row-hide-children')) row.click();
            }
            t.classList.add('ocrv-row-hide-children');
        }
    }
    unrollall() {
        if (this.levels > 1) {
            let rows = this.container.getElementsByClassName('ocrv-row-roll');
            for (let r = 0; r < rows.length; r++) {
                let row = rows[r];
                if (this.unrolled) {
                    if (row.classList.contains('ocrv-row-level-1')) {
                        if (row.classList.contains('ocrv-row-click')) row.classList.add('ocrv-row-hide-children');
                    } else {
                        if (row.classList.contains('ocrv-row-click')) {
                            row.classList.add('ocrv-row-hide-children', 'ocrv-row-hide-self');
                        } else {
                            row.classList.add('ocrv-row-hide-self');
                        }
                    }
                } else {
                    for (let r = 0; r < rows.length; r++) {
                        let row = rows[r];
                        if (row.classList.contains('ocrv-row-level-1')) {
                            if (row.classList.contains('ocrv-row-click')) row.classList.remove('ocrv-row-hide-children');
                        } else {
                            if (row.classList.contains('ocrv-row-click')) {
                                row.classList.remove('ocrv-row-hide-children', 'ocrv-row-hide-self');
                            } else {
                                row.classList.remove('ocrv-row-hide-self');
                            }
                        }
                    }
                }
            }
            this.unrolled = !this.unrolled;
        }
    }
    temple(t, d) {
        let r = /<%([^%>]+)?%>/, m;
        while (m = r.exec(t)) t = t.replace(m[0], d[m[1]]);
        return t;
    }
    export() {
        var xlsx = new BarsUp.xlsx.View();
        var sheet = xlsx.addSheet('Test sheet');

        sheet.range('A1:B2')
            .mergeCell()
            .setValue('cell text')
            .setColor('FFFFFF')
            .setBackgroundColor('000000');

        sheet.range('A4').setValue(100);
        sheet.range('A5').setValue(5);
        sheet.range('A6').setRangeProperty('formula', '=A4*A5');

        xlsx.exportToExcel({ fileName: 'example-file' });
    }

};

/*
изолировать
всё в конфиг
excel
*/