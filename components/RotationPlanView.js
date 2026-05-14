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
                  <div v-if="row.rfa" :class="['gantt-bar', 'rfa-bottom', 'rfa-' + row.rfa.type, 'rfa-' + row.rfa.status]"
                       :style="barStyle(row.rfa.rfaStart, row.rfa.rfaEnd)">
                    <span class="bar-label">{{ row.rfa.rfaNo }} · {{ row.rfa.type.toUpperCase() }}</span>
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
          id: 'v1', client: 'Global Shipping Ltd', name: 'MV Sea Star', type: 'Oil Tanker',
          ranks: [
            { rank: 'Captain', onboard: { name: 'R. Estrada', embark: '2026-02-20', signoff: '2026-08-30', contract: 6 }, isRating: false, rfa: { rfaNo: 'RFX-1074', type: 'rfx', status: 'active', rfaStart: '2026-05-01', rfaEnd: '2026-11-30' } },
            { rank: 'Chief Officer', onboard: { name: 'J. Dela Cruz', embark: '2026-02-25', signoff: '2026-09-10', contract: 6 }, isRating: false },
            { rank: 'Chief Engineer', onboard: { name: 'L. Petro', embark: '2026-05-01', signoff: '2026-11-15', contract: 6 }, isRating: false },
          ],
          rfeRows: [
            { rfaNo: 'RFE-2011', rank: 'Chief Officer', embarkDate: '2026-07-01', serviceEnd: '2026-12-30', status: 'active' },
          ],
        },
        {
          id: 'v2', client: 'Global Shipping Ltd', name: 'MV Atlantic Pride', type: 'Bulk Carrier',
          ranks: [
            { rank: 'Captain', onboard: { name: 'D. Vlasov', embark: '2026-03-10', signoff: '2026-11-10', contract: 8 }, isRating: false },
            { rank: 'Chief Officer', onboard: { name: 'S. Park', embark: '2026-04-01', signoff: '2026-10-15', contract: 6 }, isRating: false, rfa: { rfaNo: 'RFR-1051', type: 'rfr', status: 'approval', rfaStart: '2026-04-15', rfaEnd: '2026-10-15' } },
          ],
          rfeRows: [
            { rfaNo: 'RFE-2019', rank: 'Captain', embarkDate: '2026-08-05', serviceEnd: '2027-02-05', status: 'active' },
          ],
        },
        {
          id: 'v3', client: 'Blue Water Corp', name: 'Oceanic Express', type: 'Container',
          ranks: [
            { rank: 'Bosun', onboard: { name: 'F. Mercado', embark: '2026-03-05', signoff: '2026-09-30', contract: 7 }, isRating: false, rfa: { rfaNo: 'RFP-1090', type: 'rfp', status: 'active', rfaStart: '2026-05-10', rfaEnd: '2026-11-30' } },
          ],
          rfeRows: [],
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
    rowHasRfType(row, type) {
      if (type === 'any') return !!row.rfa;
      return row.rfa && row.rfa.type === type;
    },
  },
};
