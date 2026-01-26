/**
 * Admin Dashboard v1.0
 * Dashboard administrativo mejorado con mapas, gráficos y reportes
 *
 * Funcionalidades:
 * - Vista de mapa con ubicaciones en tiempo real (Leaflet.js)
 * - Gráficos de asistencia por departamento (Chart.js)
 * - Reportes avanzados (CSV, PDF)
 * - Gestión de empleados
 * - Auditoría de actividades
 * - Control de permisos y roles
 */

class AdminDashboard {
  constructor() {
    this.employees = [];
    this.attendanceData = {};
    this.auditLog = [];
    this.permissions = {
      'admin': ['view_all', 'manage_employees', 'export_reports', 'view_audit'],
      'manager': ['view_team', 'export_reports'],
      'viewer': ['view_dashboard']
    };
  }

  /**
   * Inicializar dashboard
   */
  async init() {
    try {
      console.log('[ADMIN] Inicializando Dashboard Admin');
      await this.loadEmployees();
      await this.loadAttendanceData();
      this.initMap();
      this.initCharts();
      this.setupEventListeners();
      console.log('[ADMIN] Dashboard inicializado');
    } catch (error) {
      console.error('[ADMIN ERROR] Error al inicializar:', error);
    }
  }

  /**
   * Cargar empleados desde Firebase
   */
  async loadEmployees() {
    try {
      const response = await fetch('/api/employees', {
        headers: { 'x-admin-token': localStorage.getItem('admin_token') }
      });
      this.employees = await response.json();
      this.renderEmployeeTable();
      console.log('[ADMIN] Empleados cargados:', this.employees.length);
    } catch (error) {
      console.error('[ADMIN ERROR] Error cargando empleados:', error);
    }
  }

  /**
   * Cargar datos de asistencia
   */
  async loadAttendanceData() {
    try {
      const response = await fetch('/api/attendance-stats', {
        headers: { 'x-admin-token': localStorage.getItem('admin_token') }
      });
      this.attendanceData = await response.json();
      this.updateCharts();
    } catch (error) {
      console.error('[ADMIN ERROR] Error cargando asistencia:', error);
    }
  }

  /**
   * Inicializar mapa con ubicaciones
   */
  initMap() {
    // Leaflet.js para mapa interactivo
    const mapElement = document.getElementById('admin-map');
    if (!mapElement) return;

    const map = L.map('admin-map').setView([-32.921, -60.74034], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Marcar centro de geofencing
    L.circleMarker([-32.921, -60.74034], {
      radius: 100,
      fill: false,
      color: '#3b82f6',
      weight: 2,
      opacity: 0.7,
      dashArray: '5, 5'
    }).addTo(map).bindPopup('Centro Geofencing (100m)');

    // Marcar empleados activos
    this.employees.forEach(emp => {
      if (emp.lastLocation) {
        const marker = L.marker([emp.lastLocation.lat, emp.lastLocation.lng], {
          title: emp.nombre
        }).addTo(map);
        marker.bindPopup(`<b>${emp.nombre}</b><br>Ubicación: ${emp.lastLocation.timestamp}`);
      }
    });

    console.log('[ADMIN] Mapa inicializado');
  }

  /**
   * Inicializar gráficos
   */
  initCharts() {
    this.attendanceChart = this.createAttendanceChart();
    this.departmentChart = this.createDepartmentChart();
    this.timelinessChart = this.createTimelinessChart();
  }

  /**
   * Gráfico de asistencia general
   */
  createAttendanceChart() {
    const ctx = document.getElementById('attendanceChart')?.getContext('2d');
    if (!ctx) return null;

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.getLast7Days(),
        datasets: [{
          label: 'Presente',
          data: this.attendanceData.present || [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }, {
          label: 'Ausente',
          data: this.attendanceData.absent || [],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Asistencia Últimos 7 Días' }
        }
      }
    });
  }

  /**
   * Gráfico por departamento
   */
  createDepartmentChart() {
    const ctx = document.getElementById('departmentChart')?.getContext('2d');
    if (!ctx) return null;

    const deptData = this.groupByDepartment();

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(deptData),
        datasets: [{
          label: 'Asistencia %',
          data: Object.values(deptData).map(d => d.percentage),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: {
          title: { display: true, text: 'Asistencia por Departamento' }
        }
      }
    });
  }

  /**
   * Gráfico de puntualidad
   */
  createTimelinessChart() {
    const ctx = document.getElementById('timelinessChart')?.getContext('2d');
    if (!ctx) return null;

    const timely = this.attendanceData.onTime || 0;
    const late = this.attendanceData.late || 0;

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['A Tiempo', 'Llegadas Tarde'],
        datasets: [{
          data: [timely, late],
          backgroundColor: ['#10b981', '#f59e0b']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Puntualidad Hoy' }
        }
      }
    });
  }

  /**
   * Renderizar tabla de empleados
   */
  renderEmployeeTable() {
    const tbody = document.querySelector('#employeeTable tbody');
    if (!tbody) return;

    tbody.innerHTML = this.employees.map(emp => `
      <tr>
        <td>${emp.nombre}</td>
        <td>${emp.rol}</td>
        <td>${emp.departamento || 'N/A'}</td>
        <td>${emp.uuid}</td>
        <td>
          <button onclick="adminDashboard.editEmployee('${emp.uuid}')">Editar</button>
          <button onclick="adminDashboard.deactivateEmployee('${emp.uuid}')">Desactivar</button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Editar empleado
   */
  async editEmployee(uuid) {
    const employee = this.employees.find(e => e.uuid === uuid);
    if (!employee) return;

    const newName = prompt('Nuevo nombre:', employee.nombre);
    const newRole = prompt('Nuevo rol:', employee.rol);

    if (newName && newRole) {
      try {
        const response = await fetch(`/api/employees/${uuid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': localStorage.getItem('admin_token')
          },
          body: JSON.stringify({ nombre: newName, rol: newRole })
        });
        if (response.ok) {
          this.logAudit('EDIT', `Empleado ${uuid} actualizado`);
          await this.loadEmployees();
        }
      } catch (error) {
        console.error('[ADMIN ERROR] Error editando:', error);
      }
    }
  }

  /**
   * Desactivar empleado
   */
  async deactivateEmployee(uuid) {
    if (!confirm('¿Desactivar este empleado?')) return;

    try {
      const response = await fetch(`/api/employees/${uuid}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': localStorage.getItem('admin_token') }
      });
      if (response.ok) {
        this.logAudit('DELETE', `Empleado ${uuid} desactivado`);
        await this.loadEmployees();
      }
    } catch (error) {
      console.error('[ADMIN ERROR] Error desactivando:', error);
    }
  }

  /**
   * Exportar a CSV
   */
  exportToCSV() {
    const headers = ['Nombre', 'Rol', 'Departamento', 'UUID'];
    const rows = this.employees.map(e => [
      e.nombre,
      e.rol,
      e.departamento || 'N/A',
      e.uuid
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `empleados_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.logAudit('EXPORT', 'Empleados exportados a CSV');
  }

  /**
   * Registrar en auditoría
   */
  logAudit(action, details) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      user: localStorage.getItem('admin_token')
    };
    this.auditLog.push(auditEntry);
    console.log('[AUDIT]', auditEntry);
  }

  /**
   * Helpers
   */
  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('es-AR'));
    }
    return days;
  }

  groupByDepartment() {
    return this.employees.reduce((acc, emp) => {
      const dept = emp.departamento || 'Sin Dept';
      if (!acc[dept]) acc[dept] = { count: 0, present: 0, percentage: 0 };
      acc[dept].count++;
      return acc;
    }, {});
  }

  updateCharts() {
    if (this.attendanceChart) this.attendanceChart.update();
    if (this.departmentChart) this.departmentChart.update();
    if (this.timelinessChart) this.timelinessChart.update();
  }

  setupEventListeners() {
    document.getElementById('exportBtn')?.addEventListener('click', () => this.exportToCSV());
    document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadAttendanceData());
  }
}

// Instancia global
const adminDashboard = new AdminDashboard();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => adminDashboard.init());
} else {
  adminDashboard.init();
}
