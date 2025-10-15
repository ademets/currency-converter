(function (global) {
    const isDarkMode = () =>
        global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches;

    function buildPalette() {
        if (isDarkMode()) {
            return {
                lineColor: '#4da6ff',
                gradientStart: 'rgba(77, 166, 255, 0.32)',
                gradientEnd: 'rgba(77, 166, 255, 0.02)',
                gridColor: 'rgba(148, 163, 184, 0.14)',
                labelColor: '#cbd5f5',
                axisColor: 'rgba(148, 163, 184, 0.28)',
                background: 'transparent',
            };
        }
        return {
            lineColor: '#0d61ff',
            gradientStart: 'rgba(13, 97, 255, 0.22)',
            gradientEnd: 'rgba(13, 97, 255, 0.02)',
            gridColor: 'rgba(30, 41, 59, 0.08)',
            labelColor: '#5a6372',
            axisColor: 'rgba(30, 41, 59, 0.14)',
            background: 'transparent',
        };
    }

    class MiniLineChart {
        constructor(canvas, options = {}) {
            if (!canvas) {
                throw new Error('MiniLineChart requires a canvas element.');
            }

            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.data = [];
            this.options = {
                padding: { top: 16, right: 24, bottom: 32, left: 48 },
                formatY: MiniLineChart.defaultFormatNumber,
                formatX: MiniLineChart.defaultFormatDate,
                ...options,
            };
            this.palette = buildPalette();
            this.devicePixelRatio = global.devicePixelRatio || 1;

            if (typeof ResizeObserver !== 'undefined') {
                this.resizeObserver = new ResizeObserver(() => this.handleResize());
                this.resizeObserver.observe(canvas);
            } else {
                this.boundResize = () => this.handleResize();
                global.addEventListener('resize', this.boundResize);
            }

            if (global.matchMedia) {
                this.themeListener = (event) => {
                    this.palette = buildPalette(event.matches);
                    this.render();
                };
                global.matchMedia('(prefers-color-scheme: dark)').addEventListener(
                    'change',
                    this.themeListener,
                );
            }

            this.handleResize();
        }

        destroy() {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            if (this.boundResize) {
                global.removeEventListener('resize', this.boundResize);
            }
            if (this.themeListener && global.matchMedia) {
                global.matchMedia('(prefers-color-scheme: dark)').removeEventListener(
                    'change',
                    this.themeListener,
                );
            }
        }

        setData(series) {
            this.data = Array.isArray(series) ? series.slice() : [];
            this.render();
        }

        handleResize() {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = global.devicePixelRatio || 1;
            this.devicePixelRatio = dpr;
            const width = rect.width || this.canvas.width;
            const height = rect.height || this.canvas.height;

            this.canvas.width = Math.max(1, Math.round(width * dpr));
            this.canvas.height = Math.max(1, Math.round(height * dpr));
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;

            const ctx = this.ctx;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);

            this.innerWidth = width;
            this.innerHeight = height;
            this.render();
        }

        render() {
            const ctx = this.ctx;
            if (!ctx) {
                return;
            }

            const { width, height } = ctx.canvas;
            const dpr = this.devicePixelRatio;
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, width, height);
            ctx.restore();

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.fillStyle = this.palette.background;
            ctx.fillRect(0, 0, width / dpr, height / dpr);
            ctx.restore();

            if (!this.data || this.data.length < 2) {
                return;
            }

            const padding = this.options.padding;
            const plotWidth = this.innerWidth - padding.left - padding.right;
            const plotHeight = this.innerHeight - padding.top - padding.bottom;
            if (plotWidth <= 0 || plotHeight <= 0) {
                return;
            }

            const xs = this.data.map((point) => point.timestamp);
            const ys = this.data.map((point) => point.close);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            let minY = Math.min(...ys);
            let maxY = Math.max(...ys);

            if (minY === maxY) {
                const delta = Math.abs(minY) * 0.02 || 1;
                minY -= delta;
                maxY += delta;
            }

            const toX = (timestamp) =>
                padding.left +
                ((timestamp - minX) / (maxX - minX || 1)) * plotWidth;
            const toY = (value) =>
                padding.top +
                (1 - (value - minY) / (maxY - minY || 1)) * plotHeight;

            this.drawGrid(ctx, padding, plotWidth, plotHeight, minY, maxY, toY);
            this.drawLine(ctx, toX, toY);
            this.drawArea(ctx, padding, plotHeight, toX, toY);
            this.drawExtremes(ctx, padding, plotWidth, plotHeight, minX, maxX, minY, maxY);
        }

        drawGrid(ctx, padding, plotWidth, plotHeight, minY, maxY, toY) {
            const palette = this.palette;
            ctx.save();
            ctx.strokeStyle = palette.gridColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);

            const tickCount = 3;
            for (let i = 0; i <= tickCount; i += 1) {
                const value = minY + ((maxY - minY) * i) / tickCount;
                const y = toY(value);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(padding.left + plotWidth, y);
                ctx.stroke();
            }
            ctx.restore();

            ctx.save();
            ctx.fillStyle = palette.labelColor;
            ctx.font = '12px "Inter", "Helvetica Neue", Arial, sans-serif';
            ctx.textBaseline = 'middle';

            const formatter = this.options.formatY || MiniLineChart.defaultFormatNumber;
            for (let i = 0; i <= tickCount; i += 1) {
                const value = minY + ((maxY - minY) * i) / tickCount;
                const y = toY(value);
                const label = formatter(value);
                ctx.fillText(label, 12, y);
            }
            ctx.restore();
        }

        drawLine(ctx, toX, toY) {
            const palette = this.palette;
            ctx.save();
            ctx.strokeStyle = palette.lineColor;
            ctx.lineWidth = 2.4;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.beginPath();
            this.data.forEach((point, index) => {
                const x = toX(point.timestamp);
                const y = toY(point.close);
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            ctx.restore();
        }

        drawArea(ctx, padding, plotHeight, toX, toY) {
            const palette = this.palette;
            const gradient = ctx.createLinearGradient(
                0,
                padding.top,
                0,
                padding.top + plotHeight,
            );
            gradient.addColorStop(0, palette.gradientStart);
            gradient.addColorStop(1, palette.gradientEnd);

            ctx.save();
            ctx.beginPath();
            this.data.forEach((point, index) => {
                const x = toX(point.timestamp);
                const y = toY(point.close);
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            const lastPoint = this.data[this.data.length - 1];
            const firstPoint = this.data[0];
            ctx.lineTo(toX(lastPoint.timestamp), padding.top + plotHeight);
            ctx.lineTo(toX(firstPoint.timestamp), padding.top + plotHeight);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }

        drawExtremes(ctx, padding, plotWidth, plotHeight, minX, maxX, minY, maxY) {
            const palette = this.palette;
            const formatterY = this.options.formatY || MiniLineChart.defaultFormatNumber;
            const formatterX = this.options.formatX || MiniLineChart.defaultFormatDate;

            ctx.save();
            ctx.fillStyle = palette.labelColor;
            ctx.font = '11px "Inter", "Helvetica Neue", Arial, sans-serif';
            ctx.textBaseline = 'top';

            const minLabel = `Low ${formatterY(minY)}`;
            const maxLabel = `High ${formatterY(maxY)}`;
            ctx.fillText(maxLabel, padding.left + plotWidth - ctx.measureText(maxLabel).width, padding.top - 14);
            ctx.fillText(minLabel, padding.left + plotWidth - ctx.measureText(minLabel).width, padding.top + plotHeight + 8);

            const minDate = formatterX(minX);
            const maxDate = formatterX(maxX);
            ctx.textBaseline = 'middle';
            ctx.fillText(minDate, padding.left, padding.top + plotHeight + 18);
            const maxTextWidth = ctx.measureText(maxDate).width;
            ctx.fillText(
                maxDate,
                padding.left + plotWidth - maxTextWidth,
                padding.top + plotHeight + 18,
            );
            ctx.restore();
        }

        static defaultFormatNumber(value) {
            const abs = Math.abs(value);
            if (abs >= 1e9) {
                return `${(value / 1e9).toFixed(1)}B`;
            }
            if (abs >= 1e6) {
                return `${(value / 1e6).toFixed(1)}M`;
            }
            if (abs >= 1e3) {
                return `${(value / 1e3).toFixed(1)}K`;
            }
            return value.toFixed(2);
        }

        static defaultFormatDate(timestamp) {
            const date = new Date(timestamp);
            if (Number.isNaN(date.getTime())) {
                return '';
            }
            const formatter = new Intl.DateTimeFormat(undefined, {
                month: 'short',
                day: 'numeric',
            });
            return formatter.format(date);
        }
    }

    global.MiniLineChart = MiniLineChart;
})(typeof window !== 'undefined' ? window : globalThis);
