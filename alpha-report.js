
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
            let varValue = (varObject.hasOwnProperty('value') ? varObject.value : (varObject.hasOwnProperty('defaultValue') && varObject.defaultValue != null ? varObject.defaultValue.value : ''));
            return varValue ? varValue.replace(/[[\]]/g, '').split('.') : '';
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
        this.hoverindex = -1;
        this.hovers = [];
        this.update = this.update.bind(this);
        this.beforeUpdate = this.beforeUpdate.bind(this);
        this.export = this.export.bind(this);
        this.cancel = this.cancel.bind(this);
        this.run = this.run.bind(this);
        this.unroll = this.unroll.bind(this);
        this.unrollall = this.unrollall.bind(this);
        this.tbodyhover = this.tbodyhover.bind(this);
        this.tbodyunhover = this.tbodyunhover.bind(this);
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
        let html = '<div id="' + this.id + '-ocrv-report-control" class="ocrv-report-control"><div class="ocrv-report-control-left"><button id="' + this.id + '-ocrv-report-unroll"><i class="fa fa-angle-double-down"></i>&nbsp;Развернуть всё</button></div><div class="ocrv-report-control-right"><button id="' + this.id + '-ocrv-report-export" disabled><i class="fa fa-file-excel-o"></i>&nbsp;Экспорт</button><button id="' + this.id + '-ocrv-report-run"><i class="fa fa-bolt"></i>&nbsp;Сформировать</button></div></div>';
        html += '<div id="' + this.id + '-ocrv-report-header" class="ocrv-report-header">';
        html += '<span class="ocrv-h1">' + this.h1 + '</span>';
        if (this.h2) html += '<span class="ocrv-h2">' + this.h2 + '</span>';
        html += '</div>';
        html += '<div id="' + this.id + '-ocrv-report-container" class="ocrv-report-container"></div>';
        this.widget.setWidgetHtml(html);
        this.container = document.getElementById(this.id + '-ocrv-report-container');
        this.container.style.height = (this.container.parentElement.getBoundingClientRect().height - this.container.getBoundingClientRect().top + this.container.parentElement.getBoundingClientRect().top) + 'px';
        this.container.style.overflowY = 'scroll';
        document.getElementById(this.id + '-ocrv-report-unroll').onclick = this.unrollall;
        document.getElementById(this.id + '-ocrv-report-export').onclick = this.export;
        document.getElementById(this.id + '-ocrv-report-run').onclick = this.run;
    }
    drawHead() {
        let vars = {};
        for (let v = 0; v < this.vars.length; v++) vars[this.vars[v]] = this.varParser[this.vars[v]]();
        this.html.head = '<thead id="' + this.id + '-ocrv-report-table-thead">';
        for (let tr = 0; tr < this.header.length; tr++) {
            this.html.head += '<tr' + (tr == this.header.length - 1 ? ' class="thead-row-bottom"' : '') + '>';
            for (let th = 0; th < this.header[tr].length; th++) {
                let el = this.header[tr][th];
                let elp = {
                    r: (el.hasOwnProperty('r') ? ' rowspan="' + el.r + '"' : ''),
                    c: (el.hasOwnProperty('c') ? ' colspan="' + el.c + '"' : ''),
                    n: this.temple(el.n, vars),
                    s: (el.hasOwnProperty('s') ? ' class="' + el.s + (tr == this.header.length - 1 ? ' ' + this.id + '-thead-row-bottom-' + th : '') + '"' : (tr == this.header.length - 1 ? ' class="' + this.id + '-thead-row-bottom-' + th + '"' : ''))
                };
                this.html.head += '<th' + elp.s + elp.r + elp.c + '>' + elp.n + '</th>'
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
        this.html.body = '<tbody id="' + this.id + '-ocrv-report-table-tbody">';
        for (let r = 0; r < result.rows.length; r++) {
            let row = result.rows[r];
            parents[parseInt(row.members[0]['LNum'])] = r;
            this.html.body += '<tr data-ocrv-id="ocrv-row-' + r + '" ';
            if (r > 0) {
                this.html.body += 'data-ocrv-parent="ocrv-row-' + parents[parseInt(row.members[0]['LNum']) - 1] + '" ';
            }
            if (r < result.rows.length - 1 && parseInt(result.rows[r + 1].members[0]['LNum']) > parseInt(row.members[0]['LNum'])) {
                if (row.members[0]['LNum'] == '0') {
                    this.html.body += 'class="ocrv-row-level-0"';
                } else if (row.members[0]['LNum'] == '1') {
                    this.html.body += 'class="ocrv-row-level-1 ocrv-row-click"';
                } else {
                    this.html.body += 'class="ocrv-row-roll ocrv-row-level-' + row.members[0]['LNum'] + ' ocrv-row-click"';
                }
            } else {
                if (row.members[0]['LNum'] == '0') {
                    this.html.body += 'class="ocrv-row-level-0"';
                } else if (row.members[0]['LNum'] == '1') {
                    this.html.body += 'class="ocrv-row-level-bottom"';
                } else {
                    this.html.body += 'class="ocrv-row-roll ocrv-row-level-bottom"';
                }
            }
            this.html.body += '>';
            this.levels = Math.max(parseInt(row.members[0]['LNum']), this.levels);
            if (this.numerable) this.html.body += '<td class="ocrv-item-numpp">' + (r + 1) + '</td>';
            for (let d = 0; d < row.members.length; d++) {
                this.html.body += '<td class="ocrv-item-caption">&nbsp;';
                for (let b = 0; b < parseInt(row.members[0]['LNum']); b++) {
                    this.html.body += '<span class="ocrv-item-bull">&bull;&nbsp;</span>';
                }
                this.html.body += row.members[d]['Caption'];
                this.html.body += '</td>';
            }
            for (let v = 0; v < this.values.length; v++) {
                this.html.body += '<td class="ocrv-item-value"';
                if (this.values[v].hasOwnProperty('format')) {
                    let format = this.values[v].format;
                    let val = {};
                    let dof = true;
                    for (let key in format.v) {
                        if (result._ordinalCells.hasOwnProperty(r * this.values.length + v + format.v[key])) {
                            val[key] = result._ordinalCells[r * this.values.length + v + format.v[key]]['Value'];
                        } else {
                            dof = false;
                        }
                    }
                    if (dof && format.f(val)) this.html.body += ' style="' + format.s + '"';
                }
                this.html.body += '>';
                if (result._ordinalCells.hasOwnProperty(r * this.values.length + v)) {
                    this.html.body += result._ordinalCells[r * this.values.length + v]['FmtValue'];
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
                this.html.style += Math.ceil(this.colors.first[0] + (this.colors.last[0] - this.colors.first[0]) * (l / (this.levels - 1))) + ', ';
                this.html.style += Math.ceil(this.colors.first[1] + (this.colors.last[1] - this.colors.first[1]) * (l / (this.levels - 1))) + ', ';
                this.html.style += Math.ceil(this.colors.first[2] + (this.colors.last[2] - this.colors.first[2]) * (l / (this.levels - 1)));
                this.html.style += ')}' + (l == this.levels - 1 ? '' : ' ');
            }
        } else {
            this.html.style += '.ocrv-row-level-0 {background: rgb(' + this.colors.first[0] + ', ' + this.colors.first[0] + ', ' + this.colors.first[0] + ')}';
        }
        this.html.style += ' .ocrv-row-level-bottom {background: rgb(' + this.colors.bottom[0] + ', ' + this.colors.bottom[1] + ', ' + this.colors.bottom[2] + ')}';
        this.html.style += '</style>';
    }
    applyTable() {
        let html = this.html.style + '<table id="' + this.id + '-ocrv-report-table" class="ocrv-report-table">' + this.html.head + this.html.body + '</table>';
        html += '<div id="' + this.id + '-ocrv-report-footer" class="ocrv-report-footer">';
        for (let r = 0; r < this.footer.length; r++) html += this.footer[r] + (r < this.footer.length - 1 ? '<br/>' : '');
        html += '</div>';
        this.container.innerHTML = html;
        document.getElementById(this.id + '-ocrv-report-table-tbody').onmouseover = this.tbodyhover;
        document.getElementById(this.id + '-ocrv-report-table-tbody').onmouseout = this.tbodyunhover;
        let rows = this.container.getElementsByClassName('ocrv-row-click');
        for (let r = 0; r < rows.length; r++) rows[r].onclick = this.unroll;
        this.unrollall();
        let thead = document.getElementById(this.id + '-ocrv-report-table-thead');
        let trs = thead.getElementsByTagName('tr');
        for (let r = 0; r < trs.length; r++) {
            trs[r].style.height = trs[r].getBoundingClientRect().height + 'px';
            let ths = trs[r].getElementsByTagName('th');
            for (let h = 0; h < ths.length; h++) {
                ths[h].style.width = ths[h].getBoundingClientRect().width + 'px';
            }
        }
        let theadClone = thead.cloneNode(true);
        theadClone.classList.add('ocrv-report-head-clone');
        theadClone.id = '';
        theadClone.style.top = thead.getBoundingClientRect().top + 'px';
        document.getElementById(this.id + '-ocrv-report-table-thead').after(theadClone);
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
            let rows = this.container.getElementsByClassName('ocrv-row-level-1');
            for (let r = 0; r < rows.length; r++) {
                let row = rows[r];
                if (this.unrolled) {
                    row.classList.add('ocrv-row-hide-children');
                } else {
                    row.classList.remove('ocrv-row-hide-children');
                }
            }
            rows = this.container.getElementsByClassName('ocrv-row-roll');
            for (let r = 0; r < rows.length; r++) {
                let row = rows[r];
                if (this.unrolled) {
                    if (row.classList.contains('ocrv-row-click')) {
                        row.classList.add('ocrv-row-hide-children', 'ocrv-row-hide-self');
                    } else {
                        row.classList.add('ocrv-row-hide-self');
                    }
                } else {
                    if (row.classList.contains('ocrv-row-click')) {
                        row.classList.remove('ocrv-row-hide-children', 'ocrv-row-hide-self');
                    } else {
                        row.classList.remove('ocrv-row-hide-self');
                    }
                }
            }
            if (this.unrolled) {
                document.getElementById(this.id + '-ocrv-report-unroll').innerHTML = '<i class="fa fa-angle-double-down"></i>&nbsp;Развернуть всё';
                this.unrolled = false;
            } else {
                document.getElementById(this.id + '-ocrv-report-unroll').innerHTML = '<i class="fa fa-angle-double-up"></i>&nbsp;Свернуть всё';
                this.unrolled = true;
            }
        }
    }
    temple(t, d) {
        let r = /<%([^%>]+)?%>/, m;
        while (m = r.exec(t)) t = t.replace(m[0], d[m[1]]);
        return t;
    }
    tbodyhover(e) {
        let t = e.target;
        if (t.tagName == 'TD') {
            if (t.cellIndex !== this.hoverindex) {
                for (let th = 0; th < this.hovers.length; th++) this.hovers[th].classList.remove('thead-hovered');
                this.hovers = this.container.getElementsByClassName(this.id + '-thead-row-bottom-' + t.cellIndex);
                console.log(this.hovers);
                this.hoverindex = t.cellIndex;
                console.log(this.hoverindex);
                for (let th = 0; th < this.hovers.length; th++) this.hovers[th].classList.add('thead-hovered');
            } else {
                console.log(this.hovers);
                console.log(this.hoverindex);
                for (let th = 0; th < this.hovers.length; th++) this.hovers[th].classList.add('thead-hovered');
            }
        }
    }
    tbodyunhover(e) {
        this.hovers = this.container.querySelectorAll('.thead-row-bottom th');
        for (let th = 0; th < this.hovers.length; th++) this.hovers[th].classList.remove('thead-hovered');
        this.hovers = [];
    }
    export() {
        /*
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
        */
    }
};
