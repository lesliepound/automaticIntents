

export default {


    setup() {

        const htmlContent = `
        <div class="dials">
       <div id="temperature-monitor" class="monitor-container">
        <h3 class="dial-title">Temperature</h3>
        <div class="widget">
            <div class="status-text">
                <span class="value" current="89" data-current-value="89">--</span><span class="unit"></span>
            </div>
            <div class="status-label">Awaiting Reading</div>
        </div>
    </div>
    
       <div id="bp-monitor" class="monitor-container">
        <h3 class="dial-title">Blood Pressure</h3>
        <div class="widget">
            <div class="status-text">
                <span class="value" current="140" data-current-value="140">--</span><span class="unit"></span>
            </div>
            <div class="status-label">Awaiting Reading</div>
        </div>
    </div>
 

   
    
            `;

        const dialArea = document.getElementById('manifest')
        dialArea.insertAdjacentHTML('beforeend', htmlContent);

        const painSpec = {
            toScale: 'pain', damage: '<8', good: '0-1', caution: '2-5', danger: '6-8'

        };
        const temperatureSpec = {
            toScale: 'temperature', damage: '<102', good: '87-90', caution: '90-100', danger: '100-102'


        };
    },
    respond() {
    }
}






