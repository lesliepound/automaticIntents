



    (function() {
        'use strict';

        // 1. Define the Class
        var ECGPulse = function() {
            this.demo = document.getElementById('demo');
            // Safety check: if html isn't there yet, don't crash, just wait
            this.ctx = this.demo ? this.demo.getContext('2d') : null;

            // UI Elements
            this.vitalsPanel = document.getElementById('vitals-panel');
            this.screenOverlay = document.getElementById('screen-overlay');
            this.bpmDisplay = document.getElementById('bpm-display');
            this.spo2Display = document.getElementById('spo2-display');
            this.bpDisplay = document.getElementById('bp-display');
            this.rrDisplay = document.getElementById('rr-display');
            this.heartIcon = document.getElementById('heart-icon');

            // Dimensions
            this.w = 450;
            this.h = 350;
            if(this.demo) {
                this.demo.width = this.w;
                this.demo.height = this.h;
            }
            this.hCenter = this.h / 2;

            // STATE
            this.isPowered = false;
            this.leadsAttached = false;

            // Default Values
            this.amplitude = 0;
            this.speed = 1.5;
            this.frequency = 0.065;

            // Targets
            this.targetHR = 0;
            this.targetSpO2 = 0;
            this.targetBP_Sys = 0;
            this.targetBP_Dia = 0;
            this.targetRR = 0;

            this.px = 0;
            this.frame = null;
            this.lastVitalsUpdate = 0;

            if (this.ctx) {
                this.ctx.strokeStyle = '#00ff00';
                this.ctx.lineWidth = 2.0;
                this.ctx.lineCap = 'round';
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = "#00ff00";
            }
        };

        // 2. Add Methods to the Blueprint
        ECGPulse.prototype.turnOn = function() {
            if(!this.demo) {
                // Try to find it again (in case it was hidden/missing on load)
                this.demo = document.getElementById('demo');
                this.ctx = this.demo ? this.demo.getContext('2d') : null;
                if(!this.demo) return console.error("ECG Canvas missing");
                // Reset dimensions if found late
                this.demo.width = this.w; this.demo.height = this.h;
                this.ctx.strokeStyle = '#00ff00'; this.ctx.lineWidth = 2.0;
                this.ctx.lineCap = 'round'; this.ctx.shadowBlur = 4; this.ctx.shadowColor = "#00ff00";
            }

            this.isPowered = true;
            if(this.screenOverlay) this.screenOverlay.style.display = 'none';
            if(this.vitalsPanel) this.vitalsPanel.classList.remove('power-off');
            if (!this.frame) this.loop();
        };

        ECGPulse.prototype.attachLeads = function() {
            if(!this.isPowered) return;
            this.leadsAttached = true;
            this.transitionTo('normal', 2);
        };

        ECGPulse.prototype.transitionTo = function(scenarioName, durationSeconds) {
            if(!this.isPowered) return;
            let tHR, tSys, tDia, tSpO2, tRR, tAmp = 38;

            switch(scenarioName) {
                case 'shock': tHR=145; tSys=70; tDia=40; tSpO2=90; tRR=28; break;
                case 'code_blue': tHR=0; tSys=0; tDia=0; tSpO2=0; tRR=0; tAmp=0; break;
                case 'cushings': tHR=45; tSys=220; tDia=130; tSpO2=95; tRR=10; break;
                case 'sedated': tHR=75; tSys=100; tDia=60; tSpO2=99; tRR=12; break;
                case 'normal': tHR=60; tSys=120; tDia=80; tSpO2=98; tRR=14; break;
                default: return;
            }

            const frames = durationSeconds * 60;
            const stepHR = (tHR - this.targetHR) / frames;
            const stepSys = (tSys - this.targetBP_Sys) / frames;
            const stepDia = (tDia - this.targetBP_Dia) / frames;
            const stepSpO2 = (tSpO2 - this.targetSpO2) / frames;
            const stepRR = (tRR - this.targetRR) / frames;
            const stepAmp = (tAmp - this.amplitude) / frames;

            let currentFrame = 0;
            const interval = setInterval(() => {
                currentFrame++;
                this.targetHR += stepHR;
                this.targetBP_Sys += stepSys;
                this.targetBP_Dia += stepDia;
                this.targetSpO2 += stepSpO2;
                this.targetRR += stepRR;
                this.amplitude += stepAmp;
                this.frequency = (this.targetHR > 0) ? this.targetHR / 920 : 0;
                if (currentFrame >= frames) {
                    clearInterval(interval);
                    this.targetHR=tHR; this.targetBP_Sys=tSys;
                    this.targetBP_Dia=tDia; this.targetSpO2=tSpO2; this.targetRR=tRR; this.amplitude=tAmp;
                }
            }, 16);
        };

        // Setters
        ECGPulse.prototype.setHR = function(v) { this.targetHR = v; this.frequency = v/920; };
        ECGPulse.prototype.setBP = function(s,d) { this.targetBP_Sys=s; this.targetBP_Dia=d; };
        ECGPulse.prototype.setSpO2 = function(v) { this.targetSpO2 = v; };
        ECGPulse.prototype.setRR = function(v) { this.targetRR = v; };

        ECGPulse.prototype.getECGVoltage = function(x) {
            if (this.frequency <= 0) return 0;
            var cycle = (x * this.frequency) % (Math.PI * 2);
            var y = 0;
            if (cycle > 0.5 && cycle < 1.5) y -= Math.sin(cycle) * 0.15;
            else if (cycle > 2.0 && cycle < 2.6) {
                if(cycle < 2.2) y += 0.15; else if(cycle < 2.4) y -= 1.0; else y += 0.25;
            }
            else if (cycle > 3.0 && cycle < 4.0) y -= Math.sin(cycle) * 0.25;
            return y;
        };

        ECGPulse.prototype.updateVitals = function() {
            if (!this.isPowered || !this.leadsAttached) {
                if(this.bpmDisplay) this.bpmDisplay.innerText = "--";
                if(this.spo2Display) this.spo2Display.innerText = "--";
                if(this.bpDisplay) this.bpDisplay.innerText = "--/--";
                if(this.rrDisplay) this.rrDisplay.innerText = "--";
                return;
            }
            if (Date.now() - this.lastVitalsUpdate > 1000) {
                let variance = (this.targetHR > 0) ? (Math.floor(Math.random() * 3) - 1) : 0;
                if(this.bpmDisplay) this.bpmDisplay.innerText = Math.round(this.targetHR + variance);
                if(this.spo2Display) this.spo2Display.innerText = Math.round(this.targetSpO2);
                let dSys = Math.round(this.targetBP_Sys + variance);
                let dDia = Math.round(this.targetBP_Dia + variance);
                if(this.bpDisplay) this.bpDisplay.innerText = dSys + "/" + dDia;
                if(this.rrDisplay) this.rrDisplay.innerText = Math.round(this.targetRR);
                this.lastVitalsUpdate = Date.now();
            }
            let cycle = (this.px * this.frequency) % (Math.PI * 2);
            if (this.heartIcon) {
                if (this.targetHR > 0 && cycle > 2.2 && cycle < 2.4) this.heartIcon.style.opacity = "1";
                else this.heartIcon.style.opacity = "0.2";
            }
        };

        ECGPulse.prototype.loop = function() {
            if (!this.isPowered) return;
            this.px += this.speed;
            if(this.ctx) {
                this.ctx.clearRect(0, 0, this.w, this.h);
                this.ctx.beginPath();
                var startY = this.getECGVoltage(0);
                this.ctx.moveTo(0, this.hCenter + startY * this.amplitude);
                for (let x = 1; x <= this.px; x++) {
                    var voltage = this.getECGVoltage(x);
                    const y = this.hCenter + (voltage * this.amplitude);
                    this.ctx.lineTo(x, y);
                }
                this.ctx.stroke();
            }
            this.updateVitals();
            if (this.px > this.w) this.px = 0;
            this.frame = requestAnimationFrame(this.loop.bind(this));
        };


        // 1. Expose the Class Blueprint
        window.ECGPulse = ECGPulse;

        // 2. CREATE THE INSTANCE IMMEDIATELY (Add this line)
        // This ensures window.ecg exists, even if it's waiting for the HTML to appear.
        window.ecg = new window.ECGPulse();

    })();



    //     window.resetGlobalControls = function() {
    //                 // ... your existing reset code ...
    //
    //                 // --- NEW: Reset ECG Widget ---
    //                 const ecgMonitor = document.getElementById('monitor-casing');
    //                 if (ecgMonitor) {
    //                     // 1. Hide it physically
    //                     ecgMonitor.style.display = 'none';
    //
    //                     // 2. Stop the CPU-intensive animation loop
    //                     if (window.ecg) {
    //                         window.ecg.isPowered = false;
    //         }
    //     }
    // }

window.navigateDegree = function(degrees, direction, currentValue) {

    // Find the index of the current degree
     const currentIndex = degrees.indexOf(currentValue);

    // If current degree is not found, return null or handle error
    if (currentIndex === -1) {
        return null; // or throw new Error('Current degree not found in array');
    }

    let nextIndex;

    if (direction.toLowerCase() === 'increase' ) {
        nextIndex = currentIndex + 1 //% degrees.length;
    } else if (direction.toLowerCase() === 'decrease' ) {
        // Move to previous degree, wrap around to end if at beginning
        nextIndex =  currentIndex - 1;
    } else {
        return null; // or throw new Error('Invalid direction');
    }

    return degrees[nextIndex];
}


    const addClass = (el, className) => el.classList.add(className);
    // const needle = document.querySelector('.needle');
    // const dial = document.querySelector('.dial');

//     function rotateNeedle(el,angle) {
//     el.style.left = `${angle}%`;
// }
//tags will usually include a type, aaction-amount and the object-to do ot to
window.readTagBags = function(bag,dialArray) {
    for (let i = 0; i < dialArray.length; i++) {
              const aSet = dialArray[i]; // Get the current inner array
                for (let j = 0; j < aSet.length; j++) {
                    if (aSet.contains('dial')) {
                        let newArray = aSet.filter(item => item !== 'dial');
                        let direction = findString(newArray);
                        let lastArray = aSet.filter(item => item !== 'up' || item !== 'down');
                        let dialName = lastArray[0]
                        rotateElement(dialName,rotation);
                    }
        }
    }
}
function rotateHelper(dialName,direction='up') {
    //dial =get current status
    const rotationAngle = 80;
    rotateElement(dialName, rotationAngle)
}

// Example: Rotate the needle to 90 degrees
    // rotateElement('needle',90);
window.rotateElement  = function(dialName, rotationAngle) {
    console.log(dialName,  ' rotate:',rotationAngle)

    const container = document.getElementById(dialName);
    let needle = null;
    needle = container.querySelector(".needle");

    //const needle = document.getElementById(needleElement);
    if (needle) {
        needle.style.transform = `rotate(${rotationAngle}deg)`;
    }
}

//}

