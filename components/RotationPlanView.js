const TODAY = new Date();
function d(s) { return new Date(s); }
function addM(dt, n) { const copy = new Date(dt); copy.setMonth(copy.getMonth() + n); return copy; }
function daysB(a, b) { return Math.round((b - a) / 86400000); }
function isoDate(dt) { return dt.toISOString().slice(0, 10); }

export default {
  name: 'RotationPlanView',
  template: `
    <section class="rotation-view">
      <div class="rotation-header">
        <div>
          <h2>Rotation Plan</h2>
          <p class="rotation-subtitle">Crew rotation planning with a timeline chart, filters, and vessel/rank rows.</p>
        </div>
      </div>

      <div class="rotation-filter-bar">
        <div class="rotation-filter-group">
          <label>Client</label>
          <select class="rotation-selector" v-model="filterClient" @change="filterVessel = ''">
            <option value="">All Clients</option>
            <option v-for="client in allClients" :key="client" :value="client">{{ client }}</option>
          </select>
        </div>

        <div class="rotation-filter-group">
          <label>Vessel</label>
          <select class="rotation-selector" v-model="filterVessel" :disabled="!filterClient">
            <option value="">{{ filterClient ? 'All Vessels' : 'Select client first' }}</option>
            <option v-for="vessel in clientVessels" :key="vessel.id" :value="vessel.id">{{ vessel.name }}</option>
          </select>
        </div>

        <div class="rotation-filter-group">
          <label>Rank</label>
          <select class="rotation-selector" v-model="filterRank">
            <option value="">All Ranks</option>
            <option v-for="rank in allRanks" :key="rank" :value="rank">{{ rank }}</option>
          </select>
        </div>

        <div class="rotation-filter-group">
          <label>RF Type</label>
          <div class="rotation-segmented">
            <button v-for="item in rfTypeOptions" :key="item.value" type="button"
                    :class="{ active: filterRfType === item.value }"
                    @click="filterRfType = item.value">
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="rotation-filter-group">
          <label>Window</label>
          <div class="rotation-segmented">
            <button v-for="window in [6,12,18]" :key="window" type="button"
                    :class="{ active: viewMonths === window }"
                    @click="viewMonths = window">
              {{ window }} mo
            </button>
          </div>
        </div>

        <div class="rotation-filter-group">
          <label>&nbsp;</label>
          <label class="rotation-checkbox">
            <input type="checkbox" v-model="includeRatings">
            Include Ratings
          </label>
        </div>

        <div class="rotation-filter-group">
          <label>From</label>
          <input class="rotation-input" type="date" v-model="ganttStartStr">
          <button class="rotation-reset" type="button" @click="resetGanttStart">Reset</button>
        </div>
      </div>

      <div class="rotation-chart">
        <div class="rotation-chart-header">
          <div class="rotation-left-col">Client · Vessel / Rank</div>
          <div class="gantt-grid">
            <div class="month-label-row" v-for="month in ganttMonths" :key="month.key">{{ month.label }}</div>
          </div>
        </div>

        <div class="rotation-body">
          <div class="rotation-left-col"></div>
          <div class="gantt-grid" style="min-width: 960px; position: relative;">
            <div class="today-line" :style="{ left: todayOffset * dayWidth + 'px' }"></div>
            <div class="rfa-horizon-line" :style="{ left: rfaHorizonOffset * dayWidth + 'px' }"></div>
            <div class="rfa-horizon-label" :style="{ left: rfaHorizonOffset * dayWidth + 'px' }">+2 mo</div>
            <div class="rotation-empty" v-if="filteredVessels.length === 0">No rows match the current filters.</div>
            <template v-for="vessel in filteredVessels" :key="vessel.id">
              <div class="rotation-row rotation-vessel-row">
                <div class="rank-label-col">
                  <div class="vessel-name">{{ vessel.client }} · {{ vessel.name }}</div>
                  <div class="vessel-meta">{{ vessel.type }}</div>
                </div>
                <div class="gantt-track"></div>
              </div>

              <div v-for="row in vessel.ranks" :key="vessel.id + row.rank" class="rotation-row rotation-rank-row">
                <div class="rank-label-col">
                  {{ row.rank }}
                </div>
                <div class="gantt-track">
                  <div class="gantt-grid-row">
                    <div class="grid-cell" v-for="month in ganttMonths" :key="month.key + row.rank"></div>
                  </div>
                  <div v-if="row.onboard" class="gantt-bar bar-onboard" :style="barStyle(row.onboard.embark, row.onboard.signoff)">
                    <span class="bar-label">{{ row.onboard.name }} · {{ row.onboard.contract }}mo</span>
                  </div>
                  <div v-if="row.rfa"
                       :class="['gantt-bar', 'rfa-bottom', rfaTypeClass(row.rfa), 'rfa-' + row.rfa.status]"
                       :style="barStyle(row.rfa.rfaStart, row.rfa.rfaEnd)">
                    <span class="bar-label">{{ row.rfa.rfaNo }} · {{ rfaTypeClass(row.rfa).toUpperCase() }}</span>
                  </div>
                </div>
              </div>

              <div v-for="rfe in vessel.rfeRows" :key="rfe.rfaNo" class="rotation-row rotation-rfe-row">
                <div class="rank-label-col">
                  {{ rfe.rank }} · {{ rfe.rfaNo }}
                </div>
                <div class="gantt-track">
                  <div class="gantt-grid-row">
                    <div class="grid-cell" v-for="month in ganttMonths" :key="month.key + rfe.rfaNo"></div>
                  </div>
                  <div class="gantt-bar bar-future-service" :style="barStyle(rfe.embarkDate, rfe.serviceEnd)">
                    <span class="bar-label">{{ rfe.status.toUpperCase() }}</span>
                  </div>
                  <div class="gantt-bar rfa-bottom rfa-rfe" :class="'rfa-' + rfe.status"
                       :style="barStyle(rfe.embarkDate, rfe.serviceEnd)">
                    <span class="bar-label">{{ rfe.rfaNo }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>
  `,
  data() {
    return {
      viewMonths: 12,
      dayWidth: 4,
      rankColWidth: 240,
      ganttStartStr: isoDate(addM(TODAY, -3)),
      includeRatings: false,
      filterClient: '',
      filterVessel: '',
      filterRank: '',
      filterRfType: '',
      allVessels: [
        {
          id:'v1', client:'Global Shipping Ltd',
          name:'MV Sea Star', type:'Oil Tanker', flag:'Panama',
          ranks:[
            {
              rank:'Captain',
              onboard:{ name:'RAMON ESTRADA', shortName:'R. Estrada', embark:'2025-12-15', signoff:'2026-06-15', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1042', status:'approval', rfaStart:'2026-04-15', rfaEnd:'2026-12-15', proposed:[{ name:'NIKOS PAPADOPOULOS', nationality:'Greek', service:228 },{ name:'VLADIM. PETROV', nationality:'Russian', service:192 }], confirmedSeafarer:null }
            },
            {
              rank:'Chief Officer',
              onboard:{ name:'JUAN DELA CRUZ', shortName:'J. Dela Cruz', embark:'2026-01-01', signoff:'2026-07-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1058', status:'active', rfaStart:'2026-05-01', rfaEnd:'2027-01-01', proposed:[{ name:'PETROS PAPPAS', nationality:'Greek', service:39 },{ name:'HANS MÜLLER', nationality:'German', service:94 }], confirmedSeafarer:null }
            },
            {
              rank:'Chief Engineer',
              onboard:{ name:'IVAN PETROV', shortName:'I. Petrov', embark:'2026-05-01', signoff:'2026-11-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1077', status:'active', rfaStart:'2026-09-01', rfaEnd:'2027-05-01', proposed:[], confirmedSeafarer:null }
            },
            {
              rank:'Second Engineer',
              onboard:{ name:'MARIO SANTOS', shortName:'M. Santos', embark:'2026-02-01', signoff:'2026-08-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1061', status:'deployment', rfaStart:'2026-06-01', rfaEnd:'2027-02-01', proposed:[{ name:'CARLOS REYES', nationality:'Filipino', service:26 },{ name:'AHMED HASSAN', nationality:'Egyptian', service:46 }], confirmedSeafarer:'CARLOS REYES' }
            },
            {
              rank:'Bosun',
              onboard:{ name:'FELIX MERCADO', shortName:'F. Mercado', embark:'2026-03-15', signoff:'2026-09-15', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1071', status:'active', rfaStart:'2026-07-15', rfaEnd:'2027-03-15', proposed:[], confirmedSeafarer:null }
            },
            {
              rank:'AB Deck', isRating:true,
              onboard:{ name:'PEDRO RAMOS', shortName:'P. Ramos', embark:'2026-04-01', signoff:'2026-10-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1082', status:'active', rfaStart:'2026-08-01', rfaEnd:'2027-04-01', proposed:[], confirmedSeafarer:null }
            },
            {
              rank:'Oiler', isRating:true,
              onboard:{ name:'MARK VILLANUEVA', shortName:'M. Villanueva', embark:'2026-02-10', signoff:'2026-08-10', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1083', status:'deployment', rfaStart:'2026-06-10', rfaEnd:'2027-02-10', proposed:[{ name:'RICO DELA VEGA', nationality:'Filipino', service:18 }], confirmedSeafarer:'RICO DELA VEGA' }
            },
            {
              rank:'Cook', isRating:true,
              onboard:{ name:'JOSE BUENAVENTURA', shortName:'J. Buenaventura', embark:'2026-03-20', signoff:'2026-09-20', contract:'6 months' },
              rfa:null
            },
          ]
        },
        {
          id:'v2', client:'Global Shipping Ltd',
          name:'MV Atlantic Pride', type:'Bulk Carrier', flag:'Marshall Islands',
          ranks:[
            {
              rank:'Captain',
              onboard:{ name:'DMITRI VLASOV', shortName:'D. Vlasov', embark:'2026-03-10', signoff:'2026-09-10', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1066', status:'deployment', rfaStart:'2026-07-10', rfaEnd:'2027-03-10', proposed:[{ name:'JOSE MIRANDA', nationality:'Filipino', service:160 },{ name:'A. STAVROS', nationality:'Greek', service:134 }], confirmedSeafarer:'JOSE MIRANDA' }
            },
            {
              rank:'Chief Officer',
              onboard:{ name:'SUNG-JIN PARK', shortName:'S. Park', embark:'2026-01-20', signoff:'2026-07-20', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1063', status:'approval', rfaStart:'2026-05-20', rfaEnd:'2027-01-20', proposed:[{ name:'HANS MÜLLER', nationality:'German', service:94 },{ name:'PETROS PAPPAS', nationality:'Greek', service:39 }], confirmedSeafarer:null }
            },
            {
              rank:'Chief Engineer',
              onboard:{ name:'THOMAS BERG', shortName:'T. Berg', embark:'2026-04-01', signoff:'2026-10-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1073', status:'active', rfaStart:'2026-08-01', rfaEnd:'2027-04-01', proposed:[{ name:'LEV OKONKWO', nationality:'Nigerian', service:60 }], confirmedSeafarer:null }
            },
            {
              rank:'AB Deck', isRating:true,
              onboard:{ name:'CHEN WEI', shortName:'C. Wei', embark:'2026-03-01', signoff:'2026-09-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1084', status:'approval', rfaStart:'2026-07-01', rfaEnd:'2027-03-01', proposed:[{ name:'RAUL MENDOZA', nationality:'Filipino', service:24 },{ name:'DINO REYES', nationality:'Filipino', service:12 }], confirmedSeafarer:null }
            },
            {
              rank:'Wiper', isRating:true,
              onboard:{ name:'ARIEL SANTOS', shortName:'A. Santos', embark:'2026-04-15', signoff:'2026-10-15', contract:'6 months' },
              rfa:null
            },
          ]
        },
        {
          id:'v3', client:'Blue Water Corp',
          name:'Oceanic Express', type:'Container', flag:'Liberia',
          ranks:[
            {
              rank:'Captain',
              onboard:{ name:'PHUOC NGUYEN', shortName:'P. Nguyen', embark:'2025-12-01', signoff:'2026-06-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1038', status:'deployment', rfaStart:'2026-04-01', rfaEnd:'2026-12-01', proposed:[{ name:'VLADIM. PETROV', nationality:'Russian', service:180 },{ name:'JOSE MIRANDA', nationality:'Filipino', service:160 }], confirmedSeafarer:'VLADIM. PETROV' }
            },
            {
              rank:'Second Engineer',
              onboard:{ name:'RODRIGO SANTOS', shortName:'R. Santos', embark:'2026-02-15', signoff:'2026-08-15', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1044', status:'deployment', rfaStart:'2026-06-15', rfaEnd:'2027-02-15', proposed:[{ name:'MARCO ESPOSITO', nationality:'Italian', service:115 },{ name:'AHMED HASSAN', nationality:'Egyptian', service:46 }], confirmedSeafarer:'MARCO ESPOSITO' }
            },
            {
              rank:'Chief Officer',
              onboard:{ name:'KRISTIAN ANDERSEN', shortName:'K. Andersen', embark:'2026-03-05', signoff:'2026-09-05', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1069', status:'active', rfaStart:'2026-07-05', rfaEnd:'2027-03-05', proposed:[], confirmedSeafarer:null }
            },
            {
              rank:'Electrician',
              onboard:{ name:'BENITO TORRES', shortName:'B. Torres', embark:'2026-04-10', signoff:'2026-10-10', contract:'6 months' },
              rfa:null
            },
            {
              rank:'AB Deck', isRating:true,
              onboard:{ name:'SANTOS CRUZ', shortName:'S. Cruz', embark:'2026-03-20', signoff:'2026-09-20', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1085', status:'active', rfaStart:'2026-07-20', rfaEnd:'2027-03-20', proposed:[], confirmedSeafarer:null }
            },
            {
              rank:'Motorman', isRating:true,
              onboard:{ name:'FELIX REYES', shortName:'F. Reyes', embark:'2026-01-01', signoff:'2026-07-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1086', status:'deployment', rfaStart:'2026-05-01', rfaEnd:'2027-01-01', proposed:[{ name:'ROMMEL BASA', nationality:'Filipino', service:30 }], confirmedSeafarer:null }
            },
            {
              rank:'Ordinary Seaman', isRating:true,
              onboard:{ name:'JUAN CARLOS REYES', shortName:'J. Reyes', embark:'2026-03-10', signoff:'2026-09-10', contract:'6 months' },
              rfa:null
            },
          ]
        },
        {
          id:'v4', client:'Alpha Tankers',
          name:'Alpha Prime', type:'Chemical Tanker', flag:'Greece',
          ranks:[
            {
              rank:'Captain',
              onboard:{ name:'NIKOS PAPADOPOULOS', shortName:'N. Papadopoulos', embark:'2025-11-20', signoff:'2026-05-20', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1039', status:'approval', rfaStart:'2026-03-20', rfaEnd:'2026-11-20', proposed:[{ name:'JOSE MIRANDA', nationality:'Filipino', service:160 },{ name:'VLADIM. PETROV', nationality:'Russian', service:180 },{ name:'ALEXANDROS STAVROS', nationality:'Greek', service:134 }], confirmedSeafarer:null }
            },
            {
              rank:'Chief Officer',
              onboard:{ name:'GIORGOS LAMBROS', shortName:'G. Lambros', embark:'2026-03-01', signoff:'2026-09-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1067', status:'deployment', rfaStart:'2026-07-01', rfaEnd:'2027-02-15', proposed:[{ name:'JUAN DELA CRUZ', nationality:'Filipino', service:77 },{ name:'HANS MÜLLER', nationality:'German', service:94 }], confirmedSeafarer:'JUAN DELA CRUZ' }
            },
            {
              rank:'Chief Engineer',
              onboard:{ name:'SERGEI VORONOV', shortName:'S. Voronov', embark:'2026-01-15', signoff:'2026-07-15', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1055', status:'deployment', rfaStart:'2026-05-15', rfaEnd:'2027-01-15', proposed:[{ name:'MARCO ESPOSITO', nationality:'Italian', service:115 }], confirmedSeafarer:'MARCO ESPOSITO' }
            },
            {
              rank:'Second Engineer',
              onboard:{ name:'DMITRI VOLKOV', shortName:'D. Volkov', embark:'2026-04-01', signoff:'2026-10-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1075', status:'active', rfaStart:'2026-08-01', rfaEnd:'2027-04-01', proposed:[{ name:'AHMED HASSAN', nationality:'Egyptian', service:46 }], confirmedSeafarer:null }
            },
            {
              rank:'Pump Man', isRating:true,
              onboard:{ name:'ANTONIO GARCIA', shortName:'A. Garcia', embark:'2026-02-01', signoff:'2026-08-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1087', status:'active', rfaStart:'2026-06-01', rfaEnd:'2027-02-01', proposed:[], confirmedSeafarer:null }
            },
            {
              rank:'Able Seaman', isRating:true,
              onboard:{ name:'RENATO VILLAFUERTE', shortName:'R. Villafuerte', embark:'2026-03-15', signoff:'2026-09-15', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1088', status:'deployment', rfaStart:'2026-07-15', rfaEnd:'2027-03-15', proposed:[{ name:'DANTE PASCUAL', nationality:'Filipino', service:36 },{ name:'EDGAR FLORES', nationality:'Filipino', service:24 }], confirmedSeafarer:'DANTE PASCUAL' }
            },
            {
              rank:'Oiler', isRating:true,
              onboard:{ name:'ALEX BUENAOBRA', shortName:'A. Buenaobra', embark:'2026-04-10', signoff:'2026-10-10', contract:'6 months' },
              rfa:null
            },
          ]
        },
        {
          id:'v5', client:'Alpha Tankers',
          name:'Alpha Horizon', type:'Oil Tanker', flag:'Greece',
          ranks:[
            {
              rank:'Captain',
              onboard:{ name:'ALEXANDROS STAVROS', shortName:'A. Stavros', embark:'2026-03-20', signoff:'2026-09-20', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1072', status:'deployment', rfaStart:'2026-07-20', rfaEnd:'2027-03-20', proposed:[{ name:'VLADIM. PETROV', nationality:'Russian', service:180 },{ name:'JOSE MIRANDA', nationality:'Filipino', service:160 }], confirmedSeafarer:'VLADIM. PETROV' }
            },
            {
              rank:'Chief Officer',
              onboard:{ name:'TIANHAO HUANG', shortName:'T. Huang', embark:'2026-02-01', signoff:'2026-08-01', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1068', status:'approval', rfaStart:'2026-06-01', rfaEnd:'2027-02-01', proposed:[{ name:'HANS MÜLLER', nationality:'German', service:94 },{ name:'PETROS PAPPAS', nationality:'Greek', service:39 }], confirmedSeafarer:null }
            },
            {
              rank:'Able Seaman', isRating:true,
              onboard:{ name:'MARIO LACAP', shortName:'M. Lacap', embark:'2026-03-05', signoff:'2026-09-05', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1089', status:'active', rfaStart:'2026-07-05', rfaEnd:'2027-03-05', proposed:[], confirmedSeafarer:null }
            },
            {
              rank:'Steward', isRating:true,
              onboard:{ name:'ROMEO PANGANIBAN', shortName:'R. Panganiban', embark:'2026-04-01', signoff:'2026-10-01', contract:'6 months' },
              rfa:null
            },
          ]
        },
        {
          id:'v6', client:'Pacific Logistics',
          name:'Pacific Trader', type:'RoRo', flag:'Philippines',
          ranks:[
            {
              rank:'Captain',
              onboard:{ name:'ERNESTO GARCIA', shortName:'E. Garcia', embark:'2026-04-01', signoff:'2026-10-01', contract:'6 months' },
              rfa:{ rfaNo:'RFX-1074', type:'Extend', status:'active', rfaStart:'2026-08-01', rfaEnd:'2027-04-01', proposed:[], confirmedSeafarer:null }
            },
            {
              rank:'Chief Officer',
              onboard:{ name:'ROBERTO LINO', shortName:'R. Lino', embark:'2026-01-10', signoff:'2026-07-10', contract:'6 months' },
              rfa:{ rfaNo:'RFR-1051', type:'Replace', status:'approval', rfaStart:'2026-05-10', rfaEnd:'2027-01-10', proposed:[{ name:'PETROS PAPPAS', nationality:'Greek', service:39 },{ name:'HANS MÜLLER', nationality:'German', service:94 }], confirmedSeafarer:'PETROS PAPPAS' }
            },
            {
              rank:'Bosun', isRating:true,
              onboard:{ name:'RAMIR ESPINOSA', shortName:'R. Espinosa', embark:'2026-03-01', signoff:'2026-09-01', contract:'6 months' },
              rfa:{ rfaNo:'RFP-1090', type:'Promote', status:'active', rfaStart:'2026-07-01', rfaEnd:'2027-03-01', proposed:[], confirmedSeafarer:null }
            },
            {
              rank:'Ordinary Seaman', isRating:true,
              onboard:{ name:'NOEL BACALTOS', shortName:'N. Bacaltos', embark:'2026-04-01', signoff:'2026-10-01', contract:'6 months' },
              rfa:null
            },
          ]
        },
      ],
      rfTypeOptions: [
        { value: '', label: 'All' },
        { value: 'any', label: 'Any RF' },
        { value: 'rfs', label: 'RFS' },
        { value: 'rfr', label: 'RFR' },
        { value: 'rfe', label: 'RFE' },
        { value: 'rfp', label: 'RFP' },
        { value: 'rfx', label: 'RFX' },
      ],
    };
  },
  computed: {
    ganttStart() { return d(this.ganttStartStr); },
    ganttEnd() { return addM(this.ganttStart, this.viewMonths); },
    ganttTotalDays() { return daysB(this.ganttStart, this.ganttEnd); },
    todayOffset() { return Math.max(0, daysB(this.ganttStart, TODAY)); },
    rfaHorizonOffset() { return Math.max(0, daysB(this.ganttStart, addM(TODAY, 2))); },
    ganttMonths() {
      const months = [];
      let cursor = new Date(this.ganttStart);
      while (cursor < this.ganttEnd) {
        months.push({ key: isoDate(cursor), label: cursor.toLocaleDateString('en', { month: 'short' }) });
        cursor = addM(cursor, 1);
      }
      return months;
    },
    allClients() {
      return [...new Set(this.allVessels.map(v => v.client))].sort();
    },
    clientVessels() {
      return this.filterClient ? this.allVessels.filter(v => v.client === this.filterClient) : [];
    },
    allRanks() {
      const ranks = new Set();
      this.allVessels.forEach(v => v.ranks.forEach(row => {
        if (this.includeRatings || !row.isRating) ranks.add(row.rank);
      }));
      return [...ranks].sort();
    },
    filteredVessels() {
      return this.allVessels
        .filter(v => !this.filterClient || v.client === this.filterClient)
        .filter(v => !this.filterVessel || v.id === this.filterVessel)
        .map(v => ({
          ...v,
          ranks: v.ranks.filter(row => {
            if (!this.includeRatings && row.isRating) return false;
            if (this.filterRank && row.rank !== this.filterRank) return false;
            if (this.filterRfType && this.filterRfType !== 'any' && !this.rowHasRfType(row, this.filterRfType)) return false;
            if (this.filterRfType === 'any' && !this.rowHasRfType(row, 'any')) return false;
            return true;
          }),
          rfeRows: this.filterRfType && this.filterRfType !== 'any' && this.filterRfType !== 'rfe'
            ? []
            : v.rfeRows,
        }))
        .filter(v => v.ranks.length > 0 || v.rfeRows.length > 0);
    },
  },
  methods: {
    resetGanttStart() {
      this.ganttStartStr = isoDate(addM(TODAY, -3));
    },
    clampDays(dateStr) {
      const days = daysB(this.ganttStart, d(dateStr));
      return Math.max(0, Math.min(days, this.ganttTotalDays));
    },
    barStyle(start, end) {
      const left = this.clampDays(start);
      const width = Math.max(this.clampDays(end) - left, 28);
      return { left: left * this.dayWidth + 'px', width: width * this.dayWidth + 'px' };
    },
    rfaTypeCode(rfa) {
      if (!rfa) return '';
      if (rfa.type === 'Extend') return 'rfx';
      if (rfa.type === 'Promote') return 'rfp';
      if (rfa.type === 'Replace') return 'rfr';
      const rfaNo = (rfa.rfaNo || '').toUpperCase();
      if (rfaNo.startsWith('RFS')) return 'rfs';
      if (rfaNo.startsWith('RFR')) return 'rfr';
      if (rfaNo.startsWith('RFE')) return 'rfe';
      if (rfaNo.startsWith('RFP')) return 'rfp';
      if (rfaNo.startsWith('RFX')) return 'rfx';
      return '';
    },
    rfaTypeClass(rfa) {
      return this.rfaTypeCode(rfa) || 'rfa-unknown';
    },
    rowHasRfType(row, type) {
      const rfa = row.rfa;
      const typeCode = this.rfaTypeCode(rfa);
      const rfaActive = !!(rfa && rfa.rfaStart && TODAY >= d(rfa.rfaStart));
      if (type === 'any') return !!(rfa && rfaActive);
      if (type === 'rfs') return typeCode === 'rfs';
      if (type === 'rfr') return typeCode === 'rfr';
      if (type === 'rfe') return false;
      if (type === 'rfx') return rfaActive && typeCode === 'rfx';
      if (type === 'rfp') return rfaActive && typeCode === 'rfp';
      return false;
    },
  },
};
