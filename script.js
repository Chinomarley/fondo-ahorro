import React from 'https://unpkg.com/react @18/umd/react.development.js';
import ReactDOM from 'https://unpkg.com/react-dom @18/umd/react-dom.development.js';

const App = () => {
  const [darkMode, setDarkMode] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const [history, setHistory] = React.useState([]);

  React.useEffect(() => {
    const savedHistory = localStorage.getItem('fondoAhorroCFEHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('fondoAhorroCFEHistory', JSON.stringify(history));
  }, [history]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target.result;

        const extractedText = simulateOCRProcessing();

        const parsedData = parsePapeletaText(extractedText);

        if (parsedData && !isDuplicateEntry(parsedData.periodoPago, history)) {
          setHistory(prev => [...prev, parsedData]);
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            preview: base64Image,
            data: parsedData
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const simulateOCRProcessing = () => {
    return `
      FONDO AHORRO    358.54
      PERIODO DE PAGO 16/06/25 A 29/06/25
      PERIODO DE ASISTENCIA 16/06/25 A 29/06/25
      ALCANCE NETO 7875.00
      SUELDO BASE 7000.00
    `;
  };

  const parsePapeletaText = (text) => {
    const fondoAhorroMatch = text.match(/FONDO AHORRO\s*([0-9,]+\.\d{2})/i);
    const periodoPagoMatch = text.match(/PERIODO DE PAGO\s*(\d{2}\/\d{2}\/\d{2})\s*A\s*(\d{2}\/\d{2}\/\d{2})/i);
    const alcanceNetoMatch = text.match(/ALCANCE NETO\s*([0-9,]+\.\d{2})/i);
    const sueldoBaseMatch = text.match(/SUELDO BASE\s*([0-9,]+\.\d{2})/i);

    if (!fondoAhorroMatch || !periodoPagoMatch || !alcanceNetoMatch || !sueldoBaseMatch) {
      alert("Formato de papeleta no reconocido o incompleto.");
      return null;
    }

    const fondoAhorro = parseFloat(fondoAhorroMatch[1].replace(',', ''));
    const periodoPago = `${periodoPagoMatch[1]} a ${periodoPagoMatch[2]}`;
    const alcanceNeto = parseFloat(alcanceNetoMatch[1].replace(',', ''));
    const sueldoBase = parseFloat(sueldoBaseMatch[1].replace(',', ''));

    const porcentajeAportado = (fondoAhorro / sueldoBase) * 100;
    const limiteCFE = 9.10;
    const excedeLimite = porcentajeAportado > limiteCFE;
    const aporteCFE = Math.min(porcentajeAportado, limiteCFE) / 100 * sueldoBase;

    return {
      fondoAhorro,
      periodoPago,
      alcanceNeto,
      sueldoBase,
      porcentajeAportado: porcentajeAportado.toFixed(2),
      aporteCFE: aporteCFE.toFixed(2),
      totalAcumulado: (fondoAhorro + aporteCFE).toFixed(2),
      excedeLimite
    };
  };

  const isDuplicateEntry = (periodoPago, currentHistory) => {
    return currentHistory.some(entry => entry.periodoPago === periodoPago);
  };

  const calculateTotals = () => {
    return history.reduce((totals, entry) => ({
      fondoAhorro: (parseFloat(totals.fondoAhorro) + parseFloat(entry.fondoAhorro)).toFixed(2),
      aporteCFE: (parseFloat(totals.aporteCFE) + parseFloat(entry.aporteCFE)).toFixed(2),
      totalAcumulado: (parseFloat(totals.totalAcumulado) + parseFloat(entry.totalAcumulado)).toFixed(2)
    }), {
      fondoAhorro: "0.00",
      aporteCFE: "0.00",
      totalAcumulado: "0.00"
    });
  };

  const [simulacion, setSimulacion] = React.useState({
    porcentajeAhorro: 9.10,
    mesesAhorro: 12
  });

  const handleSimulacionChange = (e) => {
    const { name, value } = e.target;
    setSimulacion(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const calcularProyeccion = () => {
    const sueldoPromedio = history.length > 0 
      ? history.reduce((sum, entry) => sum + parseFloat(entry.sueldoBase), 0) / history.length 
      : 7000;

    const porcentaje = Math.min(simulacion.porcentajeAhorro, 18.2);
    const meses = simulacion.mesesAhorro;
    
    const montoMensualTrabajador = sueldoPromedio * (porcentaje / 100);
    const montoMensualCFE = sueldoPromedio * (Math.min(porcentaje, 9.10) / 100);
    
    const totalTrabajador = montoMensualTrabajador * meses;
    const totalCFE = montoMensualCFE * meses;
    const totalFondo = totalTrabajador + totalCFE;

    return {
      sueldoPromedio: sueldoPromedio.toFixed(2),
      montoMensualTrabajador: montoMensualTrabajador.toFixed(2),
      montoMensualCFE: montoMensualCFE.toFixed(2),
      totalTrabajador: totalTrabajador.toFixed(2),
      totalCFE: totalCFE.toFixed(2),
      totalFondo: totalFondo.toFixed(2)
    };
  };

  const proyeccion = calcularProyeccion();

  return (
    React.createElement('div', { className: darkMode ? 'dark' : '' },
      React.createElement('main', { className: 'container' },
        React.createElement('h1', { className: 'text-3xl font-bold my-4' }, 'Fondo Ahorro CFE'),
        React.createElement('p', { className: 'mb-4' }, 'Aplicación para cálculo y simulación de ahorro según contrato CFE.'),

        React.createElement('section', { className: 'card' },
          React.createElement('h2', { className: 'text-xl font-semibold mb-2' }, 'Subir papeletas'),
          React.createElement('div', { className: 'upload-area' + (darkMode ? ' dark' : '') },
            React.createElement('input', {
              type: 'file',
              multiple: true,
              accept: 'image/*',
              onChange: handleFileUpload,
              className: 'hidden',
              id: 'file-upload'
            }),
            React.createElement('label', { htmlFor: 'file-upload' },
              React.createElement('span', null, 'Seleccionar archivos')
            )
          )
        ),

        uploadedFiles.length > 0 && React.createElement('section', { className: 'card' },
          React.createElement('h2', { className: 'text-xl font-semibold mb-2' }, 'Archivos subidos'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
            uploadedFiles.map((file, index) =>
              React.createElement('div', { key: index, className: 'rounded-lg shadow-md bg-gray-100 dark:bg-gray-700' },
                React.createElement('img', { src: file.preview, alt: file.name, className: 'w-full h-40 object-cover' }),
                React.createElement('div', { className: 'p-4' },
                  React.createElement('h3', { className: 'font-semibold' }, file.name),
                  React.createElement('p', null, 'Periodo: ', file.data?.periodoPago || 'No disponible'),
                  React.createElement('p', null, 'Fondo Ahorro: $', file.data?.fondoAhorro || '0.00'),
                  file.data?.excedeLimite && React.createElement('p', { className: 'text-yellow-500 mt-1' }, '⚠️ Excede el límite del 9.10%')
                )
              )
            )
          )
        ),

        history.length > 0 && React.createElement('section', { className: 'card' },
          React.createElement('h2', { className: 'text-xl font-semibold mb-2' }, 'Historial'),
          React.createElement('table', { className: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700' },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Periodo'),
                React.createElement('th', null, 'Fondo Ahorro'),
                React.createElement('th', null, 'Alcance Neto'),
                React.createElement('th', null, '% Aportado'),
                React.createElement('th', null, 'Aporte CFE'),
                React.createElement('th', null, 'Total Acumulado')
              )
            ),
            React.createElement('tbody', null,
              history.map((entry, index) =>
                React.createElement('tr', { key: index },
                  React.createElement('td', null, entry.periodoPago),
                  React.createElement('td', null, '$', entry.fondoAhorro),
                  React.createElement('td', null, '$', entry.alcanceNeto),
                  React.createElement('td', null, entry.porcentajeAportado, '%'),
                  React.createElement('td', null, '$', entry.aporteCFE),
                  React.createElement('td', null, '$', entry.totalAcumulado)
                )
              )
            )
          )
        ),

        React.createElement('section', { className: 'card' },
          React.createElement('h2', { className: 'text-xl font-semibold mb-2' }, 'Simulador'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', null, 'Porcentaje de ahorro (%)'),
              React.createElement('input', {
                type: 'range',
                min: '0',
                max: '18.2',
                step: '0.1',
                name: 'porcentajeAhorro',
                value: simulacion.porcentajeAhorro,
                onChange: handleSimulacionChange
              }),
              React.createElement('select', {
                name: 'mesesAhorro',
                value: simulacion.mesesAhorro,
                onChange: handleSimulacionChange
              },
                React.createElement('option', { value: 4 }, '4 meses'),
                React.createElement('option', { value: 8 }, '8 meses'),
                React.createElement('option', { value: 12 }, '12 meses')
              )
            ),
            React.createElement('div', null,
              React.createElement('p', null, 'Sueldo promedio: $', proyeccion.sueldoPromedio),
              React.createElement('p', null, 'Ahorro mensual trabajador: $', proyeccion.montoMensualTrabajador),
              React.createElement('p', null, 'Ahorro mensual CFE: $', proyeccion.montoMensualCFE),
              React.createElement('p', null, 'Total proyectado: $', proyeccion.totalFondo)
            )
          )
        )
      )
    )
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
