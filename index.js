#!/usr/bin/env node

// Install libs with: npm i chartjs-node-canvas chart.js
// Docs https://www.npmjs.com/package/chartjs-node-canvas
// Config documentation https://www.chartjs.org/docs/latest/axes/
const fs = require('fs');
// const lineReader = require("line-reader");
const nReadlines = require('n-readlines');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 400; //px
const height = 400; //px
const backgroundColour = 'white'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

// const numbers = fs.readFileSync("/dev/stdin", "utf8").split("\n").map(x => parseInt(x)).filter(x => !isNaN(x));

let rss = [];
let privateDirty = [];

function processFile(file)
{
    let lineNumber = 0;
    const lines = new nReadlines(file);

    console.log("Reading file", file);
    let lastRSS, lastRSSTime, lastPrivateDirty, lastPrivateDirtyTime;
    while ((l = lines.next())) {
        const line = l.toString("ascii");
        // console.log(`Line ${lineNumber} has: ${line.toString('ascii')}`);
        let match = /Rss: ([0-9]+)/.exec(line);
        if (match) {
            const time = line.substring(0, 12);
            if (time !== lastRSSTime || match[1] !== lastRSS) {
                lastRSSTime = time;
                lastRSS = match[1];
                rss.push(lastRSS);
            }
        } else {
            match = /Private_Dirty: ([0-9]+)/.exec(line);
            if (match) {
                // console.log(typeof line, line);
                const time = line.substring(0, 12);
                if (time !== lastPrivateDirtyTime || match[1] !== lastPrivateDirty) {
                    lastPrivateDirtyTime = time;
                    lastPrivateDirty = match[1];
                    privateDirty.push(lastPrivateDirty);
                }
            }
        }
        if (++lineNumber % 100000 === 0) {
            process.stdout.write(".");
        }
    }
    if (lineNumber >= 100000) {
        process.stdout.write("\n");
    }
}


for (let idx=2; idx<process.argv.length; ++idx) {
    processFile(process.argv[idx]);
}

console.log(rss, privateDirty);
const numbers = [];

let labels = rss.map((_, idx) => idx);
while (labels.length < privateDirty.length) {
    labels.push(labels.length);
}

const configuration = {
    type: 'line',   // for line chart
    data: {
        labels,
        datasets: [
            {
                label: "RSS",
                data: rss,
                fill: false,
                borderColor: ['rgb(0, 0, 255)'],
                borderWidth: 1,
                xAxisID: 'rss'
            },
            {
                label: "PrivateDirty",
                data: privateDirty,
                fill: false,
                borderColor: ['rgb(0, 0, 0)'],
                borderWidth: 1,
                xAxisID: 'privatedirty'
            }
        ]
    },
    options: {
        scales: {
            y: {
                suggestedMin: 0,
            }
        }
    }
}

async function run() {
    const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
    const base64Image = dataUrl;

    var base64Data = base64Image.replace(/^data:image\/png;base64,/, "");

    fs.writeFile("out.png", base64Data, 'base64', function (err) {
        if (err) {
            console.log(err);
        }
    });
    return dataUrl;
}
run();
