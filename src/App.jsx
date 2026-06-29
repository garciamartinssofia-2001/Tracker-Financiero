import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, AreaChart, Area, ReferenceLine } from "recharts";
import { Plus, Minus, LayoutDashboard, List, ChevronLeft, ChevronRight, X, Wallet, Trash2, Search, TrendingUp, Bell, RefreshCw, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

const injectStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f2e6dc; font-family: 'DM Sans', sans-serif; color: #3d2825; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #ead8d0; } ::-webkit-scrollbar-thumb { background: #c98b90; border-radius: 4px; }
    input, select, textarea { font-family: 'DM Sans', sans-serif; }
    .card { background: #FFFFFF; border: 1px solid #ead8d0; border-radius: 16px; box-shadow: 0 2px 12px rgba(90,61,59,0.08); }
    .card-sm { background: #FFFFFF; border: 1px solid #ead8d0; border-radius: 12px; box-shadow: 0 1px 6px rgba(90,61,59,0.05); }
    .input-field { background: #faf3ee; border: 1.5px solid #dcc8c0; border-radius: 10px; color: #3d2825; padding: 12px 14px; font-size: 14px; width: 100%; outline: none; transition: border 0.2s; }
    .input-field:focus { border-color: #a9646a; background: #fff; }
    .tab-btn { flex: 1; padding: 10px 4px; background: none; border: none; color: #c98b90; font-family: 'DM Sans'; font-size: 10px; font-weight: 600; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: color 0.2s; }
    .tab-btn.active { color: #5a3d3b; }
    .saldo-positivo { color: #2d8b5a; }
    .saldo-negativo { color: #c04848; }
    .fade-in { animation: fadeIn 0.25s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .num { font-family: 'Plus Jakarta Sans', sans-serif; }
    select option { background: #fff; color: #3d2825; }
    .venc-red { background: #fdf0f0; border: 1px solid #e8b8b8; }
    .venc-orange { background: #fdf6ee; border: 1px solid #e8d0a8; }
    .venc-green { background: #eef8f2; border: 1px solid #a8dcc0; }
  `;
  document.head.appendChild(style);
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CUENTAS = ["NX","BBVA","UALA","Efectivo","Dólares"];
const METODOS = ["Transferencia","Tarjeta","Efectivo","QR","Débito"];
const CATS_GASTO = ["Comida","Super","Auto","Deporte","Regalos","Servicios","Suscripción","Salidas","Selfcare","Sube","UBER/DIDI","Casita","Verdulería","Tarjeta de Cred.","Otros"];
const CATS_INGRESO = ["Sueldo","Inversión","Changas","Otros","Mov. entre cuentas"];
// Mov. entre cuentas NO se suma al total de ingresos (es transferencia interna entre cuentas propias)
const CATS_INGRESO_REAL = ["Sueldo","Inversión","Changas","Otros"];
const TIPOS_INV = ["Cripto","Acciones","Plazo Fijo","Dólares","Bonos","CEDEARs","Otros"];
const TIPOS_VENC = ["Tarjeta de Crédito","Servicio","Impuesto","Préstamo","Suscripción","Otro"];

const CUENTA_COLOR = { NX:"#a9646a", BBVA:"#5a3d3b", UALA:"#c98b90", Efectivo:"#2d8b5a", "Dólares":"#8B4A50" };
const CAT_COLORS = ["#a9646a","#c98b90","#8B4A50","#e7b0b6","#5a3d3b","#d4a0a5","#7a4040","#f0c8cc","#b07878","#6d4a4d","#ddb8bc","#9a6468","#c48090","#7a5560","#e8c0c4"];
const CAT_EMOJI = { Comida:"🍕", Super:"🛒", Auto:"🚗", Deporte:"🏋️", Regalos:"🎁", Servicios:"💡", Suscripción:"📱", Salidas:"🎭", Selfcare:"💆", Sube:"🚌", "UBER/DIDI":"🚕", Casita:"🏠", Verdulería:"🥬", "Tarjeta de Cred.":"💳", Otros:"📌", Sueldo:"💼", Inversión:"📈", Changas:"🔧", "Mov. entre cuentas":"🔄" };
const INV_EMOJI = { Cripto:"₿", Acciones:"📊", "Plazo Fijo":"🏦", Dólares:"💵", Bonos:"📜", CEDEARs:"🌐", Otros:"💼" };
const INV_COLOR = { Cripto:"#a9646a", Acciones:"#5a3d3b", "Plazo Fijo":"#2d8b5a", Dólares:"#8B4A50", Bonos:"#7a4040", CEDEARs:"#c98b90", Otros:"#9a7878" };

const CRYPTO_MAP = { Bitcoin:"bitcoin", Ethereum:"ethereum", Solana:"solana", BNB:"binancecoin", USDT:"tether", USDC:"usd-coin", XRP:"ripple", Cardano:"cardano", Dogecoin:"dogecoin", Polkadot:"polkadot" };

const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
const fmtUSD = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtShort = (n) => { if (Math.abs(n) >= 1000000) return `$${(n/1000000).toFixed(1)}M`; if (Math.abs(n) >= 1000) return `$${Math.round(n/1000)}K`; return `$${Math.round(n)}`; };
const diasHasta = (fecha) => { const hoy = new Date(); hoy.setHours(0,0,0,0); const f = new Date(fecha+"T00:00:00"); return Math.round((f-hoy)/(1000*60*60*24)); };
// ─── INITIAL DATA FROM NOTION ─────────────────────────────────────────────────
const SEED_GASTOS = [
  // MAYO
  {id:"g1",concepto:"Café Recoleta",categoria:"Comida",comentario:"Café Crisol → Uade Recoleta",cuenta:"BBVA",fecha:"2026-05-07",mes:"Mayo",metodo:"QR",valor:6000},
  {id:"g2",concepto:"Bondi - 04/05",categoria:"Sube",comentario:"Bondi",cuenta:"UALA",fecha:"2026-05-04",mes:"Mayo",metodo:"Tarjeta",valor:2645.52},
  {id:"g3",concepto:"Comida en lo de Dolo",categoria:"Comida",comentario:"Martes 28/04 - día de estudio",cuenta:"NX",fecha:"2026-05-03",mes:"Mayo",metodo:"Transferencia",valor:10600},
  {id:"g4",concepto:"Cena en Monti",categoria:"Comida",comentario:"Cena con Seba, Dolo y sus papas post colapinto",cuenta:"NX",fecha:"2026-05-03",mes:"Mayo",metodo:"Transferencia",valor:23180},
  {id:"g5",concepto:"Macetas Chino GR",categoria:"Casita",comentario:"Macetas + Platos",cuenta:"UALA",fecha:"2026-05-02",mes:"Mayo",metodo:"Transferencia",valor:17200},
  {id:"g6",concepto:"Super Chino GR",categoria:"Super",comentario:"Compras Baño Ofi. San Agustin",cuenta:"UALA",fecha:"2026-05-02",mes:"Mayo",metodo:"Transferencia",valor:13100},
  {id:"g7",concepto:"Pilates Abril",categoria:"Deporte",comentario:"-",cuenta:"UALA",fecha:"2026-05-01",mes:"Mayo",metodo:"Transferencia",valor:28000},
  {id:"g8",concepto:"Tacos Carlota Craft",categoria:"Comida",comentario:"3 porciones de tacos",cuenta:"Efectivo",fecha:"2026-05-01",mes:"Mayo",metodo:"Efectivo",valor:35100},
  {id:"g9",concepto:"Compra El Ciclón",categoria:"Super",comentario:"Varios (casancrem, galletitas, etc)",cuenta:"BBVA",fecha:"2026-05-02",mes:"Mayo",metodo:"QR",valor:30951},
  {id:"g10",concepto:"Compra Chino",categoria:"Comida",comentario:"Red bull + chocolates empleados ASA",cuenta:"BBVA",fecha:"2026-05-01",mes:"Mayo",metodo:"Tarjeta",valor:37000},
  {id:"g11",concepto:"Panadería Vicente Lopez",categoria:"Comida",comentario:"1/2 de factura + 1/4 de pan",cuenta:"BBVA",fecha:"2026-05-01",mes:"Mayo",metodo:"Tarjeta",valor:5800},
  {id:"g12",concepto:"Cena Cipriano c/ Agus",categoria:"Comida",comentario:"2x Verdura Cipriano",cuenta:"BBVA",fecha:"2026-05-02",mes:"Mayo",metodo:"Tarjeta",valor:40000},
  {id:"g13",concepto:"Bazar Mati",categoria:"Casita",comentario:"Escurridor, tablas, limpia bombilla",cuenta:"NX",fecha:"2026-05-02",mes:"Mayo",metodo:"Transferencia",valor:20000},
  {id:"g14",concepto:"Almuerzo Lunes 04/05",categoria:"Comida",comentario:"Tarta de panceta en Fabrica de Pasta",cuenta:"Efectivo",fecha:"2026-05-04",mes:"Mayo",metodo:"Efectivo",valor:7500},
  {id:"g15",concepto:"Estacionamiento UADE",categoria:"Auto",comentario:"-",cuenta:"NX",fecha:"2026-05-05",mes:"Mayo",metodo:"QR",valor:9000},
  {id:"g16",concepto:"Regalos Ofi.",categoria:"Regalos",comentario:"Regalo cumple Angie y Enzo",cuenta:"Efectivo",fecha:"2026-05-05",mes:"Mayo",metodo:"Efectivo",valor:20000},
  {id:"g17",concepto:"Pago Gas Depto.",categoria:"Servicios",comentario:"Abril | $4923,09 - 25% off NX",cuenta:"NX",fecha:"2026-05-04",mes:"Mayo",metodo:"Transferencia",valor:3692.32},
  {id:"g18",concepto:"Pelotas Paddle",categoria:"Deporte",comentario:"2 pelotas",cuenta:"NX",fecha:"2026-05-04",mes:"Mayo",metodo:"Transferencia",valor:10000},
  {id:"g19",concepto:"Compra Día",categoria:"Super",comentario:"2 yogures pro",cuenta:"UALA",fecha:"2026-05-06",mes:"Mayo",metodo:"Tarjeta",valor:4400},
  {id:"g20",concepto:"Grip Paleta Agus",categoria:"Deporte",comentario:"Grip negro",cuenta:"NX",fecha:"2026-05-04",mes:"Mayo",metodo:"Transferencia",valor:4000},
  {id:"g21",concepto:"Cancha de Paddle",categoria:"Deporte",comentario:"15.000 c/u (mamá y yo)",cuenta:"NX",fecha:"2026-05-04",mes:"Mayo",metodo:"Transferencia",valor:30000},
  {id:"g22",concepto:"Canva",categoria:"Suscripción",comentario:"Pago Mensual Canva Premium",cuenta:"BBVA",fecha:"2026-05-08",mes:"Mayo",metodo:"Transferencia",valor:27830},
  {id:"g23",concepto:"Verdulería GR",categoria:"Verdulería",comentario:"2 plantitas de lechuga",cuenta:"Efectivo",fecha:"2026-05-09",mes:"Mayo",metodo:"Efectivo",valor:2400},
  {id:"g24",concepto:"Panadería GR",categoria:"Comida",comentario:"1/4 de pan en Vicente Lopez",cuenta:"Efectivo",fecha:"2026-05-09",mes:"Mayo",metodo:"Efectivo",valor:1000},
  {id:"g25",concepto:"Regalo Papá",categoria:"Regalos",comentario:"Entrada concierto Ecos (120.000/3)",cuenta:"BBVA",fecha:"2026-05-10",mes:"Mayo",metodo:"Transferencia",valor:40000},
  {id:"g26",concepto:"Almuerzo Lunes 11/05",categoria:"Comida",comentario:"Bifes con ensalada",cuenta:"Efectivo",fecha:"2026-05-11",mes:"Mayo",metodo:"Efectivo",valor:6770},
  {id:"g27",concepto:"Nafta Fiestita",categoria:"Auto",comentario:"Nafta faltante - cargó facu",cuenta:"NX",fecha:"2026-05-12",mes:"Mayo",metodo:"Transferencia",valor:21000},
  {id:"g28",concepto:"Compra Super SM",categoria:"Super",comentario:"Yogurt + Galletitas",cuenta:"BBVA",fecha:"2026-05-11",mes:"Mayo",metodo:"Tarjeta",valor:5750},
  {id:"g29",concepto:"Bondi BBVA - 13/05",categoria:"Sube",comentario:"Bondi",cuenta:"BBVA",fecha:"2026-05-13",mes:"Mayo",metodo:"Tarjeta",valor:13127.19},
  {id:"g30",concepto:"Café con Seba",categoria:"Salidas",comentario:"Café en Le Molin de la Fleur + Patisserie",cuenta:"BBVA",fecha:"2026-05-08",mes:"Mayo",metodo:"Tarjeta",valor:14300},
  {id:"g31",concepto:"Almuerzo - Jueves 07/05",categoria:"Comida",comentario:"Milanesas con ensalada",cuenta:"Efectivo",fecha:"2026-05-07",mes:"Mayo",metodo:"Efectivo",valor:3580},
  {id:"g32",concepto:"Almuerzo - Martes 12",categoria:"Comida",comentario:"Guiso de Lentejas",cuenta:"Efectivo",fecha:"2026-05-12",mes:"Mayo",metodo:"Efectivo",valor:10000},
  {id:"g33",concepto:"Cancha Paddle - 11/05",categoria:"Deporte",comentario:"Cancha 1:30",cuenta:"BBVA",fecha:"2026-05-11",mes:"Mayo",metodo:"Tarjeta",valor:13500},
  {id:"g34",concepto:"Café Aerop. Cord.",categoria:"Comida",comentario:"Café Juan Valed",cuenta:"BBVA",fecha:"2026-05-14",mes:"Mayo",metodo:"Tarjeta",valor:6000},
  {id:"g35",concepto:"Kiosco Paraná y Córdoba",categoria:"Comida",comentario:"Alfajor Helado Oreo Kiosco",cuenta:"BBVA",fecha:"2026-05-13",mes:"Mayo",metodo:"Tarjeta",valor:7000},
  {id:"g36",concepto:"Almuerzo 18/05",categoria:"Comida",comentario:"Almuerzo Depo.",cuenta:"NX",fecha:"2026-05-18",mes:"Mayo",metodo:"Transferencia",valor:6575},
  {id:"g37",concepto:"Disney +",categoria:"Suscripción",comentario:"Disney +",cuenta:"NX",fecha:"2026-05-22",mes:"Mayo",metodo:"Transferencia",valor:23999},
  {id:"g38",concepto:"Estacionamiento UADE",categoria:"Auto",comentario:"Estacionamiento",cuenta:"NX",fecha:"2026-05-26",mes:"Mayo",metodo:"QR",valor:8000},
  {id:"g39",concepto:"Edesur - Mayo",categoria:"Servicios",comentario:"Pago Luz Depto.",cuenta:"NX",fecha:"2026-05-30",mes:"Mayo",metodo:"Transferencia",valor:2569.02},
  {id:"g40",concepto:"Bondi UALA 07-18/05",categoria:"Sube",comentario:"Bondi",cuenta:"UALA",fecha:"2026-05-18",mes:"Mayo",metodo:"Tarjeta",valor:7922.59},
  {id:"g41",concepto:"MP - Telepase",categoria:"Auto",comentario:"Transf. a MP para Telepase",cuenta:"NX",fecha:"2026-05-31",mes:"Mayo",metodo:"Transferencia",valor:20000},
  {id:"g42",concepto:"Didi - CBA",categoria:"UBER/DIDI",comentario:"Didi's en Cordoba - QC",cuenta:"BBVA",fecha:"2026-05-16",mes:"Mayo",metodo:"Transferencia",valor:31150},
  {id:"g43",concepto:"Hamb. MC - Agus",categoria:"Comida",comentario:"Me la pagó por NX",cuenta:"BBVA",fecha:"2026-05-16",mes:"Mayo",metodo:"Tarjeta",valor:19900},
  {id:"g44",concepto:"Nafta Fiestita",categoria:"Auto",comentario:"YPF",cuenta:"BBVA",fecha:"2026-05-17",mes:"Mayo",metodo:"Tarjeta",valor:45816.95},
  {id:"g45",concepto:"Compras Freeshop",categoria:"Regalos",comentario:"Chocolates Freeshop",cuenta:"BBVA",fecha:"2026-05-16",mes:"Mayo",metodo:"Tarjeta",valor:53000},
  {id:"g46",concepto:"Café Mamba",categoria:"Comida",comentario:"Torta Nico + Medialuna",cuenta:"BBVA",fecha:"2026-05-18",mes:"Mayo",metodo:"Tarjeta",valor:11800},
  {id:"g47",concepto:"Pago Paddle Piedras",categoria:"Deporte",comentario:"Paddle Piedras",cuenta:"BBVA",fecha:"2026-05-19",mes:"Mayo",metodo:"Transferencia",valor:30000},
  {id:"g48",concepto:"Café Uade - Rústica",categoria:"Comida",comentario:"Pepas y Scon de Queso - UADE",cuenta:"BBVA",fecha:"2026-05-19",mes:"Mayo",metodo:"Tarjeta",valor:9800},
  {id:"g49",concepto:"Nafta Camio. Mamá",categoria:"Auto",comentario:"Shell",cuenta:"BBVA",fecha:"2026-05-19",mes:"Mayo",metodo:"Tarjeta",valor:40000},
  {id:"g50",concepto:"Pago ???",categoria:"Otros",comentario:"No se :/",cuenta:"BBVA",fecha:"2026-05-20",mes:"Mayo",metodo:"Tarjeta",valor:9000},
  {id:"g51",concepto:"Pago ???",categoria:"Otros",comentario:"No se :/",cuenta:"BBVA",fecha:"2026-05-21",mes:"Mayo",metodo:"Efectivo",valor:1490},
  {id:"g52",concepto:"Matcha Life",categoria:"Comida",comentario:"Galletitas + Yougurt",cuenta:"BBVA",fecha:"2026-05-22",mes:"Mayo",metodo:"Tarjeta",valor:6400},
  {id:"g53",concepto:"Compra ML - Auto",categoria:"Auto",comentario:"Parrillas Fiesta (50% facu)",cuenta:"BBVA",fecha:"2026-05-22",mes:"Mayo",metodo:"Tarjeta",valor:101872.74},
  {id:"g54",concepto:"Nafta Facu - Fiesta",categoria:"Auto",comentario:"Nafta de facu",cuenta:"BBVA",fecha:"2026-05-26",mes:"Mayo",metodo:"Transferencia",valor:33101.94},
  {id:"g55",concepto:"Compra Días",categoria:"Super",comentario:"Compra Día",cuenta:"BBVA",fecha:"2026-05-24",mes:"Mayo",metodo:"Tarjeta",valor:14487.20},
  {id:"g56",concepto:"Compra Chino",categoria:"Super",comentario:"No se ???",cuenta:"BBVA",fecha:"2026-05-24",mes:"Mayo",metodo:"Tarjeta",valor:20700},
  {id:"g57",concepto:"Compra Kiosco",categoria:"Super",comentario:"Franuis + Chocolate",cuenta:"BBVA",fecha:"2026-05-25",mes:"Mayo",metodo:"Tarjeta",valor:31700},
  {id:"g58",concepto:"Cafe La Barrera",categoria:"Comida",comentario:"Cafe con medialunas",cuenta:"BBVA",fecha:"2026-05-28",mes:"Mayo",metodo:"Tarjeta",valor:29500},
  {id:"g59",concepto:"Pedidos Ya",categoria:"Comida",comentario:"Hamburguesas con Soria y Dolo",cuenta:"BBVA",fecha:"2026-05-29",mes:"Mayo",metodo:"Tarjeta",valor:110899},
  {id:"g60",concepto:"Didi",categoria:"UBER/DIDI",comentario:"Didi al taller Neumen",cuenta:"BBVA",fecha:"2026-05-29",mes:"Mayo",metodo:"Tarjeta",valor:5990},
  {id:"g61",concepto:"Didi",categoria:"UBER/DIDI",comentario:"Didi al taller Neumen",cuenta:"BBVA",fecha:"2026-05-29",mes:"Mayo",metodo:"Tarjeta",valor:3432},
  {id:"g62",concepto:"Carrefour GR",categoria:"Super",comentario:"Compras Varias",cuenta:"BBVA",fecha:"2026-05-31",mes:"Mayo",metodo:"Tarjeta",valor:48417.14},
  {id:"g63",concepto:"Cena Carlota - Tacos",categoria:"Comida",comentario:"Tacos Agus y yo",cuenta:"Efectivo",fecha:"2026-05-25",mes:"Mayo",metodo:"Efectivo",valor:27000},
  {id:"g64",concepto:"Almuerzo Carlota - Tacos",categoria:"Comida",comentario:"Tacos Agus, Lean y yo",cuenta:"Efectivo",fecha:"2026-05-01",mes:"Mayo",metodo:"Efectivo",valor:40500},
  // JUNIO
  {id:"g65",concepto:"Seña Paddle SM",categoria:"Deporte",comentario:"Paddle La Esquina - Nico, Seb y Dolo",cuenta:"NX",fecha:"2026-06-01",mes:"Junio",metodo:"Transferencia",valor:18000},
  {id:"g66",concepto:"Almuerzo SM - 04/06",categoria:"Comida",comentario:"Fábrica de Pasta (Juli, Leo, Sofi y yo)",cuenta:"NX",fecha:"2026-06-04",mes:"Junio",metodo:"QR",valor:39100},
  {id:"g67",concepto:"MP - Telepase",categoria:"Auto",comentario:"Transf. a MP para Telepase",cuenta:"NX",fecha:"2026-06-04",mes:"Junio",metodo:"Transferencia",valor:6000},
  {id:"g68",concepto:"Compras Capilatis",categoria:"Selfcare",comentario:"Shampoo, Acond., Perfumes, etc.",cuenta:"NX",fecha:"2026-06-04",mes:"Junio",metodo:"Transferencia",valor:86434},
  {id:"g69",concepto:"Seña Paddle SM",categoria:"Deporte",comentario:"Paddle La Esquina - Nico, Seba y Juli",cuenta:"NX",fecha:"2026-06-04",mes:"Junio",metodo:"Transferencia",valor:18000},
  {id:"g70",concepto:"BK - Seba y Dolo",categoria:"Comida",comentario:"BK en Alto Palermo",cuenta:"NX",fecha:"2026-06-06",mes:"Junio",metodo:"Transferencia",valor:20000},
  {id:"g71",concepto:"Compra Chino Capi.",categoria:"Super",comentario:"Toallitas",cuenta:"BBVA",fecha:"2026-06-01",mes:"Junio",metodo:"Transferencia",valor:1700},
  {id:"g72",concepto:"Nafta Fiesta",categoria:"Auto",comentario:"Nafta Fiesta",cuenta:"BBVA",fecha:"2026-06-01",mes:"Junio",metodo:"Tarjeta",valor:45203.96},
  {id:"g73",concepto:"Compra Chino",categoria:"Super",comentario:"Comida Agus Hospi.",cuenta:"BBVA",fecha:"2026-06-02",mes:"Junio",metodo:"Tarjeta",valor:16500},
  {id:"g74",concepto:"Pancho 46",categoria:"Comida",comentario:"Panchitos con seba y dolo",cuenta:"BBVA",fecha:"2026-06-01",mes:"Junio",metodo:"Tarjeta",valor:24000},
  {id:"g75",concepto:"Almuerzo Casona",categoria:"Comida",comentario:"Wraps",cuenta:"BBVA",fecha:"2026-06-05",mes:"Junio",metodo:"Tarjeta",valor:30839},
  {id:"g76",concepto:"Didi",categoria:"UBER/DIDI",comentario:"Didi al laburo",cuenta:"BBVA",fecha:"2026-06-05",mes:"Junio",metodo:"Tarjeta",valor:3980},
  {id:"g77",concepto:"Café Utópico",categoria:"Comida",comentario:"Caminata + Café c/ seba",cuenta:"BBVA",fecha:"2026-06-05",mes:"Junio",metodo:"Tarjeta",valor:19400},
  {id:"g78",concepto:"Pago Tarjeta Visa Gold",categoria:"Tarjeta de Cred.",comentario:"Zapatos Zara 2/3 + Equus Soleil 1/3 + Farmaonline 1/3",cuenta:"BBVA",fecha:"2026-06-05",mes:"Junio",metodo:"Tarjeta",valor:260314.96},
  {id:"g79",concepto:"Pago Tarjeta Master Gold",categoria:"Tarjeta de Cred.",comentario:"Leutthe 1/3",cuenta:"BBVA",fecha:"2026-06-05",mes:"Junio",metodo:"Tarjeta",valor:63417.32},
  {id:"g80",concepto:"Paddle QC - SM",categoria:"Deporte",comentario:"Cancha 1h + 3 paletas",cuenta:"Efectivo",fecha:"2026-06-01",mes:"Junio",metodo:"Efectivo",valor:65000},
  {id:"g81",concepto:"Nafta Fiesta",categoria:"Auto",comentario:"Nafta Fiesta",cuenta:"BBVA",fecha:"2026-06-05",mes:"Junio",metodo:"Tarjeta",valor:33325},
  {id:"g82",concepto:"Huevo Kinder para Facu",categoria:"Comida",comentario:"Huevo Kinder en la Chopera",cuenta:"BBVA",fecha:"2026-06-06",mes:"Junio",metodo:"Tarjeta",valor:4000},
];

const SEED_INGRESOS = [
  {id:"i1",concepto:"Rendim. al 06/05 - NX",categoria:"Inversión",comentario:"Rendimiento diario",cuenta:"NX",fecha:"2026-05-06",mes:"Mayo",valor:940.32},
  {id:"i2",concepto:"Sueldo Black",categoria:"Sueldo",comentario:"",cuenta:"Efectivo",fecha:"2026-05-01",mes:"Mayo",valor:1257909},
  {id:"i3",concepto:"Sueldo White",categoria:"Sueldo",comentario:"",cuenta:"BBVA",fecha:"2026-05-01",mes:"Mayo",valor:1093334},
  {id:"i4",concepto:"Rendim. al 31/05 - NX",categoria:"Inversión",comentario:"Rendimiento Diario",cuenta:"NX",fecha:"2026-05-31",mes:"Mayo",valor:5869.90},
  {id:"i5",concepto:"Rendim. al 31/05 - UALA",categoria:"Inversión",comentario:"Rendimiento Diario",cuenta:"UALA",fecha:"2026-05-31",mes:"Mayo",valor:130.39},
  {id:"i6",concepto:"Pago Seba - Cafe",categoria:"Mov. entre cuentas",comentario:"Caminata + Cafe",cuenta:"NX",fecha:"2026-05-08",mes:"Mayo",valor:8400},
  {id:"i7",concepto:"Pago Javi (Amigo Nico)",categoria:"Mov. entre cuentas",comentario:"Paddle Parque Norte",cuenta:"NX",fecha:"2026-05-12",mes:"Mayo",valor:13500},
  {id:"i8",concepto:"Pago Agus - Varios",categoria:"Mov. entre cuentas",comentario:"Compras Ofi + Empanadas + Ropa Soleil",cuenta:"NX",fecha:"2026-05-11",mes:"Mayo",valor:230000},
  {id:"i9",concepto:"Pago Nico - Paddle",categoria:"Mov. entre cuentas",comentario:"Paddle Parque Norte",cuenta:"NX",fecha:"2026-05-12",mes:"Mayo",valor:13500},
  {id:"i10",concepto:"Pago Seba - Paddle",categoria:"Mov. entre cuentas",comentario:"Paddle Parque Norte",cuenta:"NX",fecha:"2026-05-11",mes:"Mayo",valor:16500},
  {id:"i11",concepto:"Pago Agus - MC",categoria:"Mov. entre cuentas",comentario:"Hamburguesa Mc Donalds",cuenta:"NX",fecha:"2026-05-16",mes:"Mayo",valor:20000},
  {id:"i12",concepto:"Pago Seba",categoria:"Mov. entre cuentas",comentario:"Torta Cumple Nico",cuenta:"NX",fecha:"2026-05-18",mes:"Mayo",valor:4500},
  {id:"i13",concepto:"Pago Facu - Fiesta",categoria:"Mov. entre cuentas",comentario:"50% Parrillas Fiesta",cuenta:"NX",fecha:"2026-05-24",mes:"Mayo",valor:51000},
  {id:"i14",concepto:"Pago Facu - Nafta",categoria:"Mov. entre cuentas",comentario:"Nafta Fiesta - Facu",cuenta:"NX",fecha:"2026-05-26",mes:"Mayo",valor:33000},
  {id:"i15",concepto:"Pago unknow",categoria:"Mov. entre cuentas",comentario:"No se de que es :/",cuenta:"NX",fecha:"2026-05-26",mes:"Mayo",valor:9000},
  {id:"i16",concepto:"Pago Seba - Cena",categoria:"Mov. entre cuentas",comentario:"Cena c/ Dolo y Soria - Hamb.",cuenta:"NX",fecha:"2026-05-29",mes:"Mayo",valor:36666},
  {id:"i17",concepto:"Caminata + Café",categoria:"Mov. entre cuentas",comentario:"Cafe Utópico c/ Seba",cuenta:"NX",fecha:"2026-06-06",mes:"Junio",valor:9700},
  {id:"i18",concepto:"Alm. SM - Ñoquis",categoria:"Mov. entre cuentas",comentario:"Fabrica de Pasta - Juli",cuenta:"NX",fecha:"2026-06-04",mes:"Junio",valor:9800},
  {id:"i19",concepto:"Pago Juli - Paddle QC",categoria:"Mov. entre cuentas",comentario:"Paddle SM - Cancha + Paleta",cuenta:"NX",fecha:"2026-06-01",mes:"Junio",valor:17750},
  {id:"i20",concepto:"Pago Enzo - Paddle QC",categoria:"Mov. entre cuentas",comentario:"Paddle SM - Cancha + Paleta",cuenta:"NX",fecha:"2026-06-01",mes:"Junio",valor:17750},
  {id:"i21",concepto:"Pago Gus - Paddle QC",categoria:"Mov. entre cuentas",comentario:"Paddle SM - Cancha + Paleta",cuenta:"NX",fecha:"2026-06-01",mes:"Junio",valor:180000},
  {id:"i22",concepto:"Rendim. al 06/06 - NX",categoria:"Inversión",comentario:"Rendimiento Diario",cuenta:"NX",fecha:"2026-06-06",mes:"Junio",valor:1715.51},
  {id:"i23",concepto:"Pago Seba - Pancho 46",categoria:"Mov. entre cuentas",comentario:"2 panchitos",cuenta:"NX",fecha:"2026-06-03",mes:"Junio",valor:7000},
  {id:"i24",concepto:"Pago Sofi S. - Almuerzo",categoria:"Mov. entre cuentas",comentario:"Almuerzo 04/06 → Fab. de Pasta",cuenta:"Efectivo",fecha:"2026-06-05",mes:"Junio",valor:10000},
  {id:"i25",concepto:"Pago Leo - Almuerzo",categoria:"Mov. entre cuentas",comentario:"Almuerzo 04/06 → Fab. de Pasta",cuenta:"Efectivo",fecha:"2026-06-04",mes:"Junio",valor:10000},
  {id:"i26",concepto:"Almuerzo Casona",categoria:"Mov. entre cuentas",comentario:"Almuerzo 05/06 → Wraps",cuenta:"Efectivo",fecha:"2026-06-05",mes:"Junio",valor:30000},
  {id:"i27",concepto:"Sueldo Black",categoria:"Sueldo",comentario:"Sueldo Mayo",cuenta:"Efectivo",fecha:"2026-06-04",mes:"Junio",valor:1646000},
  {id:"i28",concepto:"Sueldo White",categoria:"Sueldo",comentario:"Sueldo Mayo",cuenta:"BBVA",fecha:"2026-06-01",mes:"Junio",valor:1000000},
];

const SEED_SALDOS = {
  "NX-Mayo":{inicio:348384.81,ajuste:0,nota:""},
  "BBVA-Mayo":{inicio:636644.78,ajuste:0,nota:""},
  "UALA-Mayo":{inicio:72756.55,ajuste:40,nota:"Diferencia con resumen UALA"},
  "Efectivo-Mayo":{inicio:7138441,ajuste:0,nota:""},
  "Dólares-Mayo":{inicio:4250.15,ajuste:0,nota:""},
  "NX-Junio":{inicio:592521.42,ajuste:0,nota:""},
  "BBVA-Junio":{inicio:385907.76,ajuste:0,nota:""},
  "UALA-Junio":{inicio:242.18,ajuste:0,nota:""},
  "Efectivo-Junio":{inicio:8242500,ajuste:0,nota:""},
  "Dólares-Junio":{inicio:4250.15,ajuste:0,nota:""},
};

const SEED_INVERSIONES = [
  // Dólares (en USD)
  {id:"inv1",nombre:"Dólares",tipo:"Dólares",ticker:"",cantidad:4370.15,precioCompra:1,valorActual:1,moneda:"USD",fecha:"2026-01-01",comentario:""},
  // CEDEARs — datos exactos del broker (Cocos Capital, 08/06/2026)
  {id:"inv2",nombre:"ETF S&P 500",tipo:"CEDEARs",ticker:"SPY",cantidad:6,precioCompra:17427.23,valorActual:18315.68,moneda:"ARS",fecha:"2025-06-01",comentario:"6 SPY"},
  {id:"inv3",nombre:"ETF Alcista 3X S&P 500",tipo:"CEDEARs",ticker:"SPXL",cantidad:3,precioCompra:11386.13,valorActual:15542.19,moneda:"ARS",fecha:"2025-06-01",comentario:"3 SPXL"},
  {id:"inv4",nombre:"Airbnb",tipo:"CEDEARs",ticker:"ABNB",cantidad:3,precioCompra:12282.14,valorActual:13439.59,moneda:"ARS",fecha:"2025-06-01",comentario:"3 ABNB"},
  {id:"inv5",nombre:"Alibaba",tipo:"CEDEARs",ticker:"BABA",cantidad:2,precioCompra:22590.48,valorActual:19973.08,moneda:"ARS",fecha:"2025-06-01",comentario:"2 BABA"},
  {id:"inv6",nombre:"ETF Japón",tipo:"CEDEARs",ticker:"EWJ",cantidad:4,precioCompra:8418.25,valorActual:9837.61,moneda:"ARS",fecha:"2025-06-01",comentario:"4 EWJ"},
  {id:"inv7",nombre:"Nvidia",tipo:"CEDEARs",ticker:"NVDA",cantidad:3,precioCompra:10302.94,valorActual:13038.38,moneda:"ARS",fecha:"2025-06-01",comentario:"3 NVDA"},
  {id:"inv8",nombre:"Unilever",tipo:"CEDEARs",ticker:"UL",cantidad:1,precioCompra:32741.20,valorActual:28019.70,moneda:"ARS",fecha:"2025-06-01",comentario:"1 UL"},
  {id:"inv9",nombre:"ETF Bitcoin",tipo:"CEDEARs",ticker:"IBIT",cantidad:3,precioCompra:9856.40,valorActual:5396.51,moneda:"ARS",fecha:"2025-06-01",comentario:"3 IBIT"},
];

const SEED_VENCIMIENTOS = [
  // ── Tarjetas BBVA ── (último pago 05/06, próximo vencimiento 13/07)
  {id:"v1",nombre:"Visa Gold BBVA",tipo:"Tarjeta de Crédito",fecha:"2026-07-13",monto:0,cuenta:"BBVA",recurrente:true,comentario:"Cierre 02/07 · Último resumen: cierre 28/05, vto. 05/06 ($260.314,96)"},
  {id:"v2",nombre:"Master Gold BBVA",tipo:"Tarjeta de Crédito",fecha:"2026-07-13",monto:0,cuenta:"BBVA",recurrente:true,comentario:"Cierre 02/07 · Último resumen: cierre 28/05, vto. 05/06 ($63.417,32)"},
  // ── Suscripciones ──
  {id:"v3",nombre:"Disney +",tipo:"Suscripción",fecha:"2026-06-22",monto:23999,cuenta:"NX",recurrente:true,comentario:"Último débito: 22/05 · Próximo: 22/06"},
  {id:"v4",nombre:"Canva Premium",tipo:"Suscripción",fecha:"2026-07-09",monto:27830,cuenta:"BBVA",recurrente:true,comentario:"Debitado 09/06 · Próximo: 09/07"},
  // ── Servicios Edesur (pagás con NX → 25% reintegro, tope $4.000/mes) ──
  {id:"v5",nombre:"Edesur Depto — Factura 1",tipo:"Servicio",fecha:"2026-06-16",monto:42490.30,cuenta:"NX",recurrente:true,comentario:"Reintegro NX 25% → $4.000 (tope máximo)"},
  {id:"v6",nombre:"Edesur Depto — Factura 2",tipo:"Servicio",fecha:"2026-06-16",monto:51912.71,cuenta:"NX",recurrente:true,comentario:"Reintegro NX 25% → $4.000 (tope máximo)"},
  // ── Gas ──
  {id:"v7",nombre:"Gas Depto",tipo:"Servicio",fecha:"2026-07-13",monto:4881.44,cuenta:"NX",recurrente:true,comentario:"Reintegro NX 25% → $1.220,36"},
];

// Historial del portafolio — pre-cargado de screenshot UALA (09/06/2026, 1A)
// Valores aproximados extraídos del gráfico "Evolución de tu portafolio"
const SEED_PORTFOLIO_HISTORY = [
  {fecha:"2025-06-09",valor:0},
  {fecha:"2025-07-01",valor:0},
  {fecha:"2025-08-01",valor:0},
  {fecha:"2025-09-01",valor:125000},
  {fecha:"2025-09-15",valor:295000},
  {fecha:"2025-10-01",valor:342000},
  {fecha:"2025-10-15",valor:368000},
  {fecha:"2025-11-01",valor:362000},
  {fecha:"2025-11-15",valor:355000},
  {fecha:"2025-12-01",valor:350000},
  {fecha:"2025-12-15",valor:344000},
  {fecha:"2026-01-01",valor:349000},
  {fecha:"2026-01-15",valor:345000},
  {fecha:"2026-02-01",valor:340000},
  {fecha:"2026-02-15",valor:348000},
  {fecha:"2026-03-01",valor:356000},
  {fecha:"2026-03-15",valor:350000},
  {fecha:"2026-04-01",valor:346000},
  {fecha:"2026-04-15",valor:359000},
  {fecha:"2026-05-01",valor:361000},
  {fecha:"2026-05-15",valor:354000},
  {fecha:"2026-06-01",valor:359000},
  {fecha:"2026-06-08",valor:361762},
  {fecha:"2026-06-09",valor:357088}, // Screenshot UALA 09/06
];
const save = async (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {} };
const load = async (key, fallback) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch(e) { return fallback; } };

// ─── GOOGLE SHEETS SYNC ───────────────────────────────────────────────────────
const syncToSheets = (data, tipo) => {
  const url = localStorage.getItem('sheets_url');
  if (!url) return;
  try {
    fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ ...data, tipo }) });
  } catch(e) {}
};

// ─── TOOLTIPS ────────────────────────────────────────────────────────────────
const CTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return <div style={{background:"#fff",border:"1px solid #ead8d0",borderRadius:10,padding:"10px 14px",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}>
    <div style={{fontSize:11,color:"#9a7878",marginBottom:4}}>{payload[0].payload.cat}</div>
    <div style={{fontFamily:"Plus Jakarta Sans",fontSize:15,fontWeight:700,color:payload[0].fill}}>{fmtShort(payload[0].value)}</div>
  </div>;
};
const LTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div style={{background:"#fff",border:"1px solid #ead8d0",borderRadius:10,padding:"12px 16px",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}>
    <div style={{fontSize:12,color:"#9a7878",marginBottom:8,fontWeight:600}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{fontSize:13,fontWeight:700,color:p.color,fontFamily:"Plus Jakarta Sans"}}>{p.name}: {fmtShort(p.value)}</div>)}
  </div>;
};

// ─── TRANSACTION FORM ────────────────────────────────────────────────────────
function TransactionForm({ type, onSave, onClose, selectedMes }) {
  const isGasto = type === "gasto";
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ concepto:"", categoria: isGasto?"Comida":"Sueldo", comentario:"", cuenta:"NX", fecha:today, mes:selectedMes, metodo:"Transferencia", valor:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const accent = isGasto ? "#c04848" : "#2d8b5a";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,32,53,0.5)",zIndex:100,display:"flex",flexDirection:"column",justifyContent:"flex-end",backdropFilter:"blur(4px)"}}>
      <div className="fade-in" style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontFamily:"Plus Jakarta Sans",fontSize:20,fontWeight:800,color:accent}}>{isGasto?"➖ Nuevo Gasto":"➕ Nuevo Ingreso"}</div>
            <div style={{fontSize:12,color:"#9a7878",marginTop:2}}>{selectedMes} 2026</div>
          </div>
          <button onClick={onClose} style={{background:"#f2e6dc",border:"none",color:"#5C6E8A",borderRadius:10,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={16}/></button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><div style={{fontSize:12,color:"#9a7878",marginBottom:6,fontWeight:600}}>Concepto *</div><input className="input-field" placeholder="Ej: Almuerzo" value={form.concepto} onChange={e=>set("concepto",e.target.value)}/></div>
          <div><div style={{fontSize:12,color:"#9a7878",marginBottom:6,fontWeight:600}}>Monto (ARS) *</div><input className="input-field" type="number" placeholder="0" value={form.valor} onChange={e=>set("valor",e.target.value)}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><div style={{fontSize:12,color:"#9a7878",marginBottom:6,fontWeight:600}}>Cuenta</div><select className="input-field" value={form.cuenta} onChange={e=>set("cuenta",e.target.value)}>{CUENTAS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><div style={{fontSize:12,color:"#9a7878",marginBottom:6,fontWeight:600}}>Mes</div><select className="input-field" value={form.mes} onChange={e=>set("mes",e.target.value)}>{MESES.map(m=><option key={m}>{m}</option>)}</select></div>
          </div>
          <div>
            <div style={{fontSize:12,color:"#9a7878",marginBottom:8,fontWeight:600}}>Categoría</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(isGasto?CATS_GASTO:CATS_INGRESO).map(c=>(
                <button key={c} onClick={()=>set("categoria",c)} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${form.categoria===c?accent:"#dcc8c0"}`,background:form.categoria===c?`${accent}15`:"#faf3ee",color:form.categoria===c?accent:"#5C6E8A",fontSize:12,cursor:"pointer",fontWeight:500}}>
                  {CAT_EMOJI[c]||""} {c}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><div style={{fontSize:12,color:"#9a7878",marginBottom:6,fontWeight:600}}>Fecha</div><input className="input-field" type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)}/></div>
            {isGasto && <div><div style={{fontSize:12,color:"#9a7878",marginBottom:6,fontWeight:600}}>Método</div><select className="input-field" value={form.metodo} onChange={e=>set("metodo",e.target.value)}>{METODOS.map(m=><option key={m}>{m}</option>)}</select></div>}
          </div>
          <div><div style={{fontSize:12,color:"#9a7878",marginBottom:6,fontWeight:600}}>Comentario</div><input className="input-field" placeholder="Detalles..." value={form.comentario} onChange={e=>set("comentario",e.target.value)}/></div>
          <button onClick={()=>{if(!form.concepto||!form.valor)return;onSave({...form,id:Date.now().toString(),valor:parseFloat(form.valor)});onClose();}} style={{marginTop:8,background:accent,color:"white",border:"none",borderRadius:12,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%"}}>
            Guardar {isGasto?"Gasto":"Ingreso"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VENCIMIENTOS CARD ───────────────────────────────────────────────────────
function VencimientosCard({ vencimientos, onAdd, onDel }) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const proximos = vencimientos
    .map(v=>({...v,dias:diasHasta(v.fecha)}))
    .sort((a,b)=>a.dias-b.dias)
    .slice(0,6);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({nombre:"",tipo:"Tarjeta de Crédito",fecha:"",monto:"",cuenta:"BBVA",recurrente:false,comentario:""});
  const s = (k,v) => setForm(f=>({...f,[k]:v}));
  const alertas = vencimientos.filter(v=>diasHasta(v.fecha)<=7 && diasHasta(v.fecha)>=0).length;
  return (
    <div className="card" style={{padding:"18px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,color:"#3d2825"}}>🔔 Vencimientos</div>
          {alertas>0&&<div style={{background:"#c04848",color:"white",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700}}>{alertas} urgente{alertas>1?"s":""}</div>}
        </div>
        <button onClick={()=>setShowForm(s=>!s)} style={{background:"#f2e6dc",border:"1px solid #dcc8c0",borderRadius:8,color:"#a9646a",padding:"6px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Agregar</button>
      </div>
      {showForm && (
        <div style={{background:"#faf3ee",borderRadius:12,padding:14,marginBottom:14,display:"flex",flexDirection:"column",gap:10}}>
          <input className="input-field" style={{fontSize:13,padding:"10px 12px"}} placeholder="Nombre *" value={form.nombre} onChange={e=>s("nombre",e.target.value)}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <select className="input-field" style={{fontSize:13,padding:"10px 12px"}} value={form.tipo} onChange={e=>s("tipo",e.target.value)}>{TIPOS_VENC.map(t=><option key={t}>{t}</option>)}</select>
            <select className="input-field" style={{fontSize:13,padding:"10px 12px"}} value={form.cuenta} onChange={e=>s("cuenta",e.target.value)}>{CUENTAS.map(c=><option key={c}>{c}</option>)}</select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <input className="input-field" style={{fontSize:13,padding:"10px 12px"}} type="date" value={form.fecha} onChange={e=>s("fecha",e.target.value)}/>
            <input className="input-field" style={{fontSize:13,padding:"10px 12px"}} type="number" placeholder="Monto ARS" value={form.monto} onChange={e=>s("monto",e.target.value)}/>
          </div>
          <input className="input-field" style={{fontSize:13,padding:"10px 12px"}} placeholder="Comentario..." value={form.comentario} onChange={e=>s("comentario",e.target.value)}/>
          <button onClick={()=>{if(!form.nombre||!form.fecha)return;onAdd({...form,id:Date.now().toString(),monto:parseFloat(form.monto)||0});setShowForm(false);setForm({nombre:"",tipo:"Tarjeta de Crédito",fecha:"",monto:"",cuenta:"BBVA",recurrente:false,comentario:""});}} style={{background:"#a9646a",color:"white",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Guardar</button>
        </div>
      )}
      {proximos.length===0 && <div style={{textAlign:"center",color:"#9a7878",padding:"20px 0",fontSize:13}}>No hay vencimientos próximos</div>}
      {proximos.map(v=>{
        const vclass = v.dias<0?"venc-red":v.dias<=7?"venc-red":v.dias<=15?"venc-orange":"venc-green";
        const vcolor = v.dias<0?"#c04848":v.dias<=7?"#c04848":v.dias<=15?"#E67700":"#2d8b5a";
        const vicon = v.dias<0?<AlertCircle size={14}/>:v.dias<=7?<AlertTriangle size={14}/>:<CheckCircle size={14}/>;
        return (
          <div key={v.id} className={vclass} style={{borderRadius:10,padding:"11px 13px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{color:vcolor,display:"flex"}}>{vicon}</span>
                <span style={{fontSize:13,fontWeight:600,color:"#3d2825",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.nombre}</span>
              </div>
              <div style={{fontSize:11,color:"#9a7878"}}>{v.cuenta} · {v.fecha} · {v.monto>0?fmt(v.monto):""}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:8}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"Plus Jakarta Sans",fontSize:13,fontWeight:800,color:vcolor}}>
                  {v.dias<0?`Hace ${Math.abs(v.dias)}d`:v.dias===0?"¡Hoy!":`${v.dias}d`}
                </div>
              </div>
              <button onClick={()=>onDel(v.id)} style={{background:"none",border:"none",color:"#C5D0E8",cursor:"pointer",display:"flex",padding:3}}><X size={13}/></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── INVERSIONES VIEW ────────────────────────────────────────────────────────
const CEDEAR_EMOJI = { SPY:"🇺🇸", SPXL:"📈", ABNB:"🏠", BABA:"🛒", EWJ:"🇯🇵", NVDA:"🤖", UL:"🌿", IBIT:"₿" };
const CEDEAR_COLOR = ["#a9646a","#5a3d3b","#c98b90","#8B4A50","#7a4040","#2d8b5a","#e7b0b6","#6d4a4d"];

function InversionesView({ inversiones, onAdd, onDel, tipoCambio, onTipoCambioFetched }) {
  const [precios, setPrecios] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingTC, setLoadingTC] = useState(false);
  const [tab, setTab] = useState("composicion");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({nombre:"",tipo:"CEDEARs",ticker:"",cantidad:"",precioCompra:"",moneda:"USD",fecha:new Date().toISOString().split("T")[0],comentario:""});
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  const fetchBNA = async () => {
    setLoadingTC(true);
    try {
      const r = await fetch("https://dolarapi.com/v1/dolares/oficial");
      const d = await r.json();
      if (d?.venta) { onTipoCambioFetched(parseFloat(d.venta)); setLoadingTC(false); return; }
    } catch(e) {}
    try {
      const r = await fetch("https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial");
      const d = await r.json();
      const last = Array.isArray(d) ? d[d.length-1] : d;
      if (last?.venta) { onTipoCambioFetched(parseFloat(last.venta)); setLoadingTC(false); return; }
    } catch(e) {}
    setLoadingTC(false);
  };

  const fetchPrices = async () => {
    setLoadingPrices(true);
    const tickers = [...new Set(inversiones.filter(i=>i.tipo==="Cripto"&&i.ticker).map(i=>i.ticker))];
    if (tickers.length > 0) {
      try {
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers.join(",")}&vs_currencies=usd`);
        if (r.ok) { const d = await r.json(); setPrecios(p=>({...p,...d})); }
      } catch(e) {}
    }
    setLoadingPrices(false);
  };

  useEffect(()=>{ fetchBNA(); fetchPrices(); }, []);

  // ── Historial del portafolio ──────────────────────────────────────────────
  const [rPeriod, setRPeriod] = useState("1A");
  const [portfolioHistory, setPortfolioHistory] = useState(SEED_PORTFOLIO_HISTORY);

  // Cargar historial del storage al montar
  useEffect(()=>{
    load("portfolio_history_v1", null).then(ph => {
      if (ph) setPortfolioHistory(ph);
    });
  }, []);
  const [showAddSnapshot, setShowAddSnapshot] = useState(false);
  const [snapFecha, setSnapFecha] = useState(new Date().toISOString().split("T")[0]);
  const [snapValor, setSnapValor] = useState("");
  const [rData, setRData] = useState([]);
  const [rLoading, setRLoading] = useState(false);
  const [rError, setRError] = useState(null);

  // Unused but keeping for compat
  const fetchYahoo = async () => null;

  const buildChartData = (history, period) => {
    if (!history.length) return [];
    const now = new Date();
    const dias = {"1S":7,"1M":30,"6M":180,"1A":365}[period];
    const desde = new Date(now - dias*24*60*60*1000).toISOString().split("T")[0];
    const filtrado = history.filter(p=>p.fecha>=desde).sort((a,b)=>a.fecha.localeCompare(b.fecha));
    if (!filtrado.length) return [];
    const cedearOrigen = inversiones.filter(i=>i.tipo==="CEDEARs").reduce((s,i)=>s+i.cantidad*i.precioCompra,0);
    return filtrado.map(p=>({
      fecha: p.fecha.slice(5).replace("-","/"),
      valor: p.valor,
      referencia: Math.round(cedearOrigen),
    }));
  };

  const fetchRendimiento = async (period) => {
    setRLoading(true); setRError(null);
    // Intentar enriquecer con Yahoo Finance (best effort)
    const yRange = {"1S":"7d","1M":"1mo","6M":"6mo","1A":"1y"}[period];
    const cedears = inversiones.filter(i=>i.tipo==="CEDEARs"&&i.ticker);
    const tickers = [...new Set(cedears.map(i=>i.ticker))];
    let enriched = false;
    try {
      const urls = tickers.map(t=>[
        `https://query2.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=${yRange}`,
        `https://corsproxy.io/?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=${yRange}`)}`,
      ]).flat();
      const fetches = await Promise.all(tickers.map(async ticker=>{
        for (const url of [`https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${yRange}`,`https://corsproxy.io/?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${yRange}`)}`]) {
          try {
            const r = await fetch(url);
            if (!r.ok) continue;
            const raw = await r.json();
            const d = raw.contents ? JSON.parse(raw.contents) : raw;
            const res = d?.chart?.result?.[0];
            if (!res) continue;
            const ts = res.timestamp;
            const px = res.indicators.quote[0].close;
            const pts = ts.map((t,i)=>({fecha:new Date(t*1000).toISOString().split("T")[0],price:px[i]})).filter(e=>e.price!=null);
            if (pts.length>0) return {ticker, pts};
          } catch(e) { continue; }
        }
        return {ticker, pts:null};
      }));
      const ok = fetches.filter(f=>f.pts?.length);
      if (ok.length >= tickers.length/2) {
        // Build enriched history from Yahoo data
        const pMap = {};
        const cPrice = {};
        for (const {ticker,pts} of ok) {
          if (!pts) continue;
          cPrice[ticker] = pts[pts.length-1].price;
          pMap[ticker] = Object.fromEntries(pts.map(p=>[p.fecha,p.price]));
        }
        const allDates = [...new Set(ok.flatMap(f=>f.pts?.map(p=>p.fecha)||[]))].sort();
        const lastK = {};
        const newPts = [];
        const step = period==="1S"?1:period==="1M"?1:period==="6M"?2:3;
        const cedearOrigen = cedears.reduce((s,i)=>s+i.cantidad*i.precioCompra,0);
        for (let i=0;i<allDates.length;i++) {
          const fecha=allDates[i];
          for (const t of Object.keys(cPrice)) { if (pMap[t]?.[fecha]) lastK[t]=pMap[t][fecha]; }
          if (i%step!==0&&i!==allDates.length-1) continue;
          let total=0;
          for (const inv of cedears) { const cp=cPrice[inv.ticker],lk=lastK[inv.ticker]; if (cp&&lk) total+=inv.cantidad*(inv.valorActual||inv.precioCompra)*(lk/cp); }
          if (total>0) newPts.push({fecha:fecha.slice(5).replace("-","/"),valor:Math.round(total),referencia:Math.round(cedearOrigen)});
        }
        if (newPts.length>0) { setRData(newPts); enriched=true; }
      }
    } catch(e) {}
    if (!enriched) {
      // Usar historial manual/pre-cargado
      const data = buildChartData(portfolioHistory, period);
      if (data.length>0) setRData(data);
      else setRError("Agregá snapshots manuales desde UALA para ver el gráfico.");
    }
    setRLoading(false);
  };

  const addSnapshot = () => {
    if (!snapValor || !snapFecha) return;
    const newPt = {fecha:snapFecha, valor:parseFloat(snapValor.replace(/\./g,"").replace(",","."))};
    const updated = [...portfolioHistory.filter(p=>p.fecha!==snapFecha), newPt].sort((a,b)=>a.fecha.localeCompare(b.fecha));
    setPortfolioHistory(updated);
    save("portfolio_history_v1", updated);
    setShowAddSnapshot(false);
    setSnapValor("");
  };


  useEffect(()=>{ if(portfolioHistory.length) fetchRendimiento(rPeriod); }, [rPeriod, portfolioHistory]);

  // Valor en ARS de cada inversión
  // valorActual = precio actual por unidad, precioCompra = precio original pagado
  const getValorARS = (inv) => {
    if (inv.tipo==="Cripto" && precios[inv.ticker]) return inv.cantidad * precios[inv.ticker].usd * tipoCambio;
    if (inv.moneda==="USD") return inv.cantidad * (inv.valorActual||inv.precioCompra) * tipoCambio;
    return inv.cantidad * (inv.valorActual||inv.precioCompra); // ARS
  };
  const getValorUSD = (inv) => {
    if (inv.tipo==="Cripto" && precios[inv.ticker]) return inv.cantidad * precios[inv.ticker].usd;
    if (inv.moneda==="USD") return inv.cantidad * (inv.valorActual||inv.precioCompra);
    return inv.cantidad * (inv.valorActual||inv.precioCompra) / tipoCambio;
  };
  // precioCompra siempre = precio original de compra
  const getInvertidoARS = (inv) => inv.moneda==="USD" ? inv.cantidad*inv.precioCompra*tipoCambio : inv.cantidad*inv.precioCompra;
  const getInvertidoUSD = (inv) => inv.moneda==="USD" ? inv.cantidad*inv.precioCompra : inv.cantidad*inv.precioCompra/tipoCambio;

  const totalUSD = inversiones.reduce((s,i) => s + getValorUSD(i), 0);
  const totalARS = inversiones.reduce((s,i) => s + getValorARS(i), 0);
  const totalInvertidoUSD = inversiones.reduce((s,i) => s + getInvertidoUSD(i), 0);
  const gananciaUSD = totalUSD - totalInvertidoUSD;
  const gananciaPct = totalInvertidoUSD > 0 ? (gananciaUSD / totalInvertidoUSD * 100) : 0;

  const cedears = inversiones.filter(i=>i.tipo==="CEDEARs");

  return (
    <div className="fade-in" style={{padding:"14px 14px 0"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontFamily:"Plus Jakarta Sans",fontSize:18,fontWeight:800,color:"#3d2825"}}>📈 Inversiones</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={fetchBNA} disabled={loadingTC} style={{background:"#f2e6dc",border:"1px solid #dcc8c0",borderRadius:8,color:"#a9646a",padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            <RefreshCw size={11} style={{animation:loadingTC?"spin 1s linear infinite":"none"}}/> BNA
          </button>
          <button onClick={()=>setShowForm(v=>!v)} style={{background:"#a9646a",border:"none",borderRadius:8,color:"white",padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nueva</button>
        </div>
      </div>

      {/* Tipo de cambio badge */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
        <div style={{fontSize:12,color:"#9a7878",fontWeight:500}}>Tipo de cambio BNA venta:</div>
        <div style={{background:"#f5e8e4",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700,color:"#a9646a",fontFamily:"Plus Jakarta Sans"}}>${tipoCambio.toLocaleString("es-AR")}</div>
      </div>

      {/* Total card */}
      <div style={{background:"linear-gradient(135deg,#3d2825,#a9646a)",borderRadius:20,padding:"20px",marginBottom:12,color:"white"}}>
        <div style={{fontSize:12,opacity:0.8,marginBottom:4}}>Portafolio total</div>
        <div style={{fontFamily:"Plus Jakarta Sans",fontSize:28,fontWeight:800,marginBottom:2}}>{fmt(totalARS)}</div>
        <div style={{fontSize:13,opacity:0.7,marginBottom:12}}>≈ {fmtUSD(totalUSD)} USD</div>
        <div style={{display:"flex",gap:12}}>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"8px 12px",flex:1}}>
            <div style={{fontSize:10,opacity:0.8,marginBottom:2}}>GANANCIA</div>
            <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,color:gananciaUSD>=0?"#A5F3C4":"#FFB3B3"}}>
              {gananciaUSD>=0?"+":""}{fmtUSD(gananciaUSD)}
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"8px 12px",flex:1}}>
            <div style={{fontSize:10,opacity:0.8,marginBottom:2}}>RENDIMIENTO</div>
            <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,color:gananciaPct>=0?"#A5F3C4":"#FFB3B3"}}>
              {gananciaPct>=0?"+":""}{gananciaPct.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Composición / Rendimiento tabs */}
      <div style={{display:"flex",background:"#f0e4e0",borderRadius:12,padding:4,marginBottom:14}}>
        {[["composicion","Composición"],["rendimiento","Rendimiento"]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:tab===key?"#fff":"transparent",color:tab===key?"#a9646a":"#9a7878",fontFamily:"Plus Jakarta Sans",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s",boxShadow:tab===key?"0 2px 8px rgba(59,91,219,0.1)":"none"}}>
            {label}
          </button>
        ))}
      </div>

      {/* COMPOSICIÓN TAB */}
      {tab==="composicion" && (
        <div>
          {/* Dólares */}
          {inversiones.filter(i=>i.tipo==="Dólares").map((inv,idx)=>{
            const vUSD = getValorUSD(inv);
            const vARS = getValorARS(inv);
            const pct = totalARS>0?(vARS/totalARS*100):0;
            return (
              <div key={inv.id} className="card-sm" style={{padding:"14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"#FFF9DB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>💵</div>
                    <div>
                      <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,color:"#3d2825"}}>{inv.nombre}</div>
                      <div style={{fontSize:11,color:"#9a7878"}}>{fmtUSD(inv.cantidad)} · {fmt(vARS)} ARS</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"Plus Jakarta Sans",fontSize:15,fontWeight:800,color:"#E67700"}}>{fmtUSD(vUSD)}</div>
                    <div style={{fontSize:11,color:"#9a7878"}}>{pct.toFixed(1)}% del total</div>
                  </div>
                </div>
                <div style={{background:"#f2e6dc",borderRadius:4,height:6,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:"#E67700",borderRadius:4,transition:"width 0.5s"}}/>
                </div>
                <button onClick={()=>onDel(inv.id)} style={{background:"none",border:"none",color:"#C5D0E8",cursor:"pointer",display:"flex",padding:"4px 0 0",fontSize:11}}><Trash2 size={12}/></button>
              </div>
            );
          })}

          {/* CEDEARs section header */}
          {cedears.length>0 && (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"14px 0 10px"}}>
              <div style={{fontFamily:"Plus Jakarta Sans",fontSize:13,fontWeight:700,color:"#3d2825"}}>🌐 CEDEARs / Acciones</div>
              <div style={{fontSize:12,color:"#9a7878",fontWeight:600}}>{fmt(cedears.reduce((s,i)=>s+getValorARS(i),0))}</div>
            </div>
          )}

          {/* CEDEAR items */}
          {cedears.map((inv,idx)=>{
            const vARS = getValorARS(inv);
            const pct = totalARS>0?(vARS/totalARS*100):0;
            const color = CEDEAR_COLOR[idx%CEDEAR_COLOR.length];
            const emoji = CEDEAR_EMOJI[inv.ticker]||"📊";
            return (
              <div key={inv.id} className="card-sm" style={{padding:"14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:color}}>
                      {emoji}
                    </div>
                    <div>
                      <div style={{fontFamily:"Plus Jakarta Sans",fontSize:13,fontWeight:700,color:"#3d2825"}}>{inv.nombre}</div>
                      <div style={{fontSize:11,color:"#9a7878"}}>{inv.cantidad} {inv.ticker} · {fmtShort(inv.precioCompra)} ARS c/u</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:800,color}}>{fmt(vARS)}</div>
                    <div style={{fontSize:11,color:"#9a7878"}}>{pct.toFixed(1)}% del total</div>
                  </div>
                </div>
                <div style={{background:"#f2e6dc",borderRadius:4,height:5,overflow:"hidden",marginBottom:6}}>
                  <div style={{width:`${Math.min(pct*3,100)}%`,height:"100%",background:color,borderRadius:4,transition:"width 0.5s"}}/>
                </div>
                <button onClick={()=>onDel(inv.id)} style={{background:"none",border:"none",color:"#C5D0E8",cursor:"pointer",display:"flex",padding:0,fontSize:11}}><Trash2 size={12}/></button>
              </div>
            );
          })}

          {/* Other types */}
          {inversiones.filter(i=>i.tipo!=="CEDEARs"&&i.tipo!=="Dólares").map((inv,idx)=>{
            const v = getValorUSD(inv);
            const pct = totalUSD>0?(v/totalUSD*100):0;
            return (
              <div key={inv.id} className="card-sm" style={{padding:"14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${INV_COLOR[inv.tipo]||"#a9646a"}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{INV_EMOJI[inv.tipo]||"💼"}</div>
                    <div>
                      <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,color:"#3d2825"}}>{inv.nombre}</div>
                      <div style={{fontSize:11,color:"#9a7878"}}>{inv.tipo} · {inv.cantidad} unid.</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:800,color:INV_COLOR[inv.tipo]||"#a9646a"}}>{inv.moneda==="ARS"?fmtShort(v):fmtUSD(v)}</div>
                    <div style={{fontSize:11,color:"#9a7878"}}>{pct.toFixed(1)}%</div>
                  </div>
                </div>
                <div style={{background:"#f2e6dc",borderRadius:4,height:5,overflow:"hidden",marginBottom:6}}>
                  <div style={{width:`${pct}%`,height:"100%",background:INV_COLOR[inv.tipo]||"#a9646a",borderRadius:4}}/>
                </div>
                <button onClick={()=>onDel(inv.id)} style={{background:"none",border:"none",color:"#C5D0E8",cursor:"pointer",display:"flex"}}><Trash2 size={12}/></button>
              </div>
            );
          })}
        </div>
      )}

      {/* RENDIMIENTO TAB */}
      {tab==="rendimiento" && (
        <div>
          {(() => {
            const cedearHoy = inversiones.filter(i=>i.tipo==="CEDEARs").reduce((s,i)=>s+i.cantidad*(i.valorActual||i.precioCompra),0);
            const cedearOrigen = inversiones.filter(i=>i.tipo==="CEDEARs").reduce((s,i)=>s+i.cantidad*i.precioCompra,0);
            const gARS = cedearHoy - cedearOrigen;
            const gPct = cedearOrigen>0?((gARS/cedearOrigen)*100):0;
            const firstVal = rData[0]?.valor;
            const lastVal = rData[rData.length-1]?.valor;
            const periodoGain = firstVal&&lastVal ? lastVal-firstVal : 0;
            const periodoGainPct = firstVal&&firstVal>0 ? (periodoGain/firstVal*100) : 0;
            return (
              <>
                {/* Header — datos confirmados de UALA */}
                <div style={{textAlign:"center",marginBottom:16,padding:"4px 0 0"}}>
                  <div style={{fontSize:12,color:"#9a7878",marginBottom:4}}>Total invertido · datos UALA al 09/06/2026</div>
                  <div style={{fontFamily:"Plus Jakarta Sans",fontSize:34,fontWeight:800,color:"#3d2825",letterSpacing:"-1px"}}>
                    {fmt(cedearOrigen)}
                  </div>
                  <div style={{fontSize:12,color:"#9a7878",marginTop:4}}>Valor actual: <span style={{fontWeight:700,color:"#3d2825"}}>{fmt(cedearHoy)}</span></div>
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:8}}>
                    <div style={{background:"#eef8f2",borderRadius:20,padding:"5px 16px",fontSize:13,fontWeight:700,color:"#2d8b5a"}}>
                      +{fmt(gARS)}
                    </div>
                    <div style={{background:"#eef8f2",borderRadius:20,padding:"5px 16px",fontSize:13,fontWeight:700,color:"#2d8b5a"}}>
                      +{gPct.toFixed(2)}%
                    </div>
                    <div style={{background:"#f5e8e4",borderRadius:20,padding:"5px 16px",fontSize:13,fontWeight:700,color:"#a9646a"}}>
                      UALA: +6.62%
                    </div>
                  </div>
                </div>

                {/* Botón agregar snapshot */}
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
                  <button onClick={()=>setShowAddSnapshot(v=>!v)} style={{background:"#f2e6dc",border:"1px solid #dcc8c0",borderRadius:8,color:"#a9646a",padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                    📲 Actualizar desde UALA
                  </button>
                </div>
                {showAddSnapshot && (
                  <div className="card" style={{padding:16,marginBottom:14}}>
                    <div style={{fontFamily:"Plus Jakarta Sans",fontSize:13,fontWeight:700,marginBottom:10,color:"#3d2825"}}>📲 Registrar valor del portafolio</div>
                    <div style={{fontSize:11,color:"#9a7878",marginBottom:10}}>Abrí UALA → Mi portafolio → Composición → ingresá el "Total invertido"</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                      <div>
                        <div style={{fontSize:11,color:"#9a7878",marginBottom:4,fontWeight:600}}>Fecha</div>
                        <input className="input-field" type="date" style={{fontSize:13,padding:"10px 12px"}} value={snapFecha} onChange={e=>setSnapFecha(e.target.value)}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:"#9a7878",marginBottom:4,fontWeight:600}}>Valor total (ARS)</div>
                        <input className="input-field" type="number" style={{fontSize:13,padding:"10px 12px"}} placeholder="357088" value={snapValor} onChange={e=>setSnapValor(e.target.value)}/>
                      </div>
                    </div>
                    <button onClick={addSnapshot} style={{background:"#a9646a",color:"white",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>
                      Guardar snapshot
                    </button>
                  </div>
                )}

                {/* Chart card */}
                <div style={{background:"#fff",borderRadius:20,padding:"20px 6px 16px",marginBottom:16,boxShadow:"0 2px 16px rgba(90,61,59,0.08)"}}>
                  <div style={{paddingLeft:14,marginBottom:16}}>
                    <div style={{fontFamily:"Plus Jakarta Sans",fontSize:16,fontWeight:800,color:"#3d2825"}}>Evolución de tu portafolio</div>
                    <div style={{fontSize:12,color:"#9a7878",marginTop:2}}>
                      proxy SPY · {({"1S":"última semana","1M":"último mes","6M":"últimos 6 meses","1A":"último año"})[rPeriod]}
                    </div>
                  </div>
                  {/* Period selectors */}
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:16}}>
                    {["1S","1M","6M","1A"].map(p=>(
                      <button key={p} onClick={()=>setRPeriod(p)} style={{width:48,height:36,borderRadius:20,border:"none",background:rPeriod===p?"#f5e8e4":"#faf3ee",color:rPeriod===p?"#a9646a":"#9a7878",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                        {p}{rPeriod===p&&<span style={{fontSize:9}}>✓</span>}
                      </button>
                    ))}
                  </div>

                  {rLoading && <div style={{height:220,display:"flex",alignItems:"center",justifyContent:"center",color:"#9a7878",fontSize:13}}>Cargando datos de mercado...</div>}
                  {rError && !rLoading && (
                    <div style={{height:120,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#9a7878",fontSize:12,gap:8,textAlign:"center",padding:"0 20px"}}>
                      ⚠️ {rError}
                      <button onClick={()=>fetchRendimiento(rPeriod)} style={{background:"#f2e6dc",border:"1px solid #dcc8c0",borderRadius:8,color:"#a9646a",padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Reintentar</button>
                    </div>
                  )}

                  {!rLoading && !rError && rData.length>0 && (
                    <>
                      {/* Periodo gain badge */}
                      {periodoGain!==0 && (
                        <div style={{textAlign:"center",marginBottom:10}}>
                          <span style={{background:periodoGain>=0?"#eef8f2":"#fdf0f0",borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:700,color:periodoGain>=0?"#2d8b5a":"#c04848"}}>
                            {periodoGain>=0?"▲":"▼"} {periodoGain>=0?"+":""}{fmt(periodoGain)} ({periodoGainPct>=0?"+":""}{periodoGainPct.toFixed(2)}%) en el período
                          </span>
                        </div>
                      )}
                      <ResponsiveContainer width="100%" height={230}>
                        <AreaChart data={rData} margin={{left:0,right:0,top:10,bottom:0}}>
                          <defs>
                            <linearGradient id="cedearGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#a9646a" stopOpacity={0.25}/>
                              <stop offset="100%" stopColor="#a9646a" stopOpacity={0.02}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#faf3ee" strokeDasharray="0" vertical={false} horizontal={false}/>
                          <XAxis dataKey="fecha" tick={{fontSize:11,fill:"#9a7878"}} axisLine={false} tickLine={false} interval="preserveStartEnd" dy={8}/>
                          <YAxis hide domain={["auto","auto"]}/>
                          <Tooltip
                            formatter={(v)=>[fmt(v), "Portafolio"]}
                            contentStyle={{background:"#fff",border:"1px solid #ead8d0",borderRadius:12,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",padding:"10px 14px"}}
                            labelStyle={{fontWeight:700,color:"#3d2825",marginBottom:4,fontSize:12}}
                          />
                          <ReferenceLine y={rData[0]?.referencia} stroke="#9a7878" strokeDasharray="4 3" strokeWidth={1.5} strokeOpacity={0.5}/>
                          <Area type="monotone" dataKey="valor" stroke="#a9646a" strokeWidth={2.5} fill="url(#cedearGrad)" dot={false} activeDot={{r:5,fill:"#a9646a",strokeWidth:0}}/>
                        </AreaChart>
                      </ResponsiveContainer>
                      <div style={{display:"flex",justifyContent:"space-between",paddingLeft:16,paddingRight:16,marginTop:4}}>
                        <span style={{fontSize:11,color:"#C5D0E8"}}>{rData[0]?.fecha}</span>
                        <span style={{fontSize:11,color:"#C5D0E8"}}>{rData[rData.length-1]?.fecha}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Detalle por posición */}
                <div style={{fontFamily:"Plus Jakarta Sans",fontSize:13,fontWeight:700,marginBottom:10,color:"#3d2825"}}>Por posición</div>
                {inversiones.map((inv,idx)=>{
                  const valorAct = getValorARS(inv);
                  const invertido = getInvertidoARS(inv);
                  const g = valorAct - invertido;
                  const gp = invertido>0?(g/invertido*100):0;
                  const color = CEDEAR_COLOR[idx%CEDEAR_COLOR.length];
                  const isARS = inv.moneda==="ARS";
                  return (
                    <div key={inv.id} className="card-sm" style={{padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:34,height:34,borderRadius:9,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
                          {CEDEAR_EMOJI[inv.ticker]||INV_EMOJI[inv.tipo]||"📊"}
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:"#3d2825"}}>{inv.nombre}</div>
                          <div style={{fontSize:11,color:"#9a7878"}}>{inv.ticker||inv.tipo} · {isARS?fmt(valorAct):fmtUSD(getValorUSD(inv))}</div>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"Plus Jakarta Sans",fontSize:13,fontWeight:800,color:g>=0?"#2d8b5a":"#c04848"}}>{g>=0?"+":""}{isARS?fmtShort(g):fmtUSD(g)}</div>
                        <div style={{fontSize:11,fontWeight:700,color:g>=0?"#2d8b5a":"#c04848",background:g>=0?"#eef8f2":"#fdf0f0",padding:"2px 8px",borderRadius:10,display:"inline-block"}}>{gp>=0?"+":""}{gp.toFixed(2)}%</div>
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card" style={{padding:16,marginTop:12,marginBottom:12}}>
          <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,marginBottom:12,color:"#a9646a"}}>Nueva Inversión</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input className="input-field" style={{fontSize:13,padding:"10px 12px"}} placeholder="Nombre *" value={form.nombre} onChange={e=>sf("nombre",e.target.value)}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <select className="input-field" style={{fontSize:13,padding:"10px 12px"}} value={form.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS_INV.map(t=><option key={t}>{t}</option>)}</select>
              <input className="input-field" style={{fontSize:13,padding:"10px 12px"}} placeholder="Ticker (ej: SPY)" value={form.ticker} onChange={e=>sf("ticker",e.target.value.toUpperCase())}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div><div style={{fontSize:11,color:"#9a7878",marginBottom:4,fontWeight:600}}>Cantidad</div><input className="input-field" style={{fontSize:13,padding:"10px 12px"}} type="number" step="any" placeholder="0" value={form.cantidad} onChange={e=>sf("cantidad",e.target.value)}/></div>
              <div><div style={{fontSize:11,color:"#9a7878",marginBottom:4,fontWeight:600}}>Precio compra (USD)</div><input className="input-field" style={{fontSize:13,padding:"10px 12px"}} type="number" step="any" placeholder="0" value={form.precioCompra} onChange={e=>sf("precioCompra",e.target.value)}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div><div style={{fontSize:11,color:"#9a7878",marginBottom:4,fontWeight:600}}>Fecha</div><input className="input-field" style={{fontSize:13,padding:"10px 12px"}} type="date" value={form.fecha} onChange={e=>sf("fecha",e.target.value)}/></div>
              <div><div style={{fontSize:11,color:"#9a7878",marginBottom:4,fontWeight:600}}>Comentario</div><input className="input-field" style={{fontSize:13,padding:"10px 12px"}} placeholder="Opcional" value={form.comentario} onChange={e=>sf("comentario",e.target.value)}/></div>
            </div>
            <button onClick={()=>{
              if(!form.nombre||!form.cantidad)return;
              onAdd({...form,id:Date.now().toString(),cantidad:parseFloat(form.cantidad),precioCompra:parseFloat(form.precioCompra)||0});
              setShowForm(false);
              setForm({nombre:"",tipo:"CEDEARs",ticker:"",cantidad:"",precioCompra:"",moneda:"USD",fecha:new Date().toISOString().split("T")[0],comentario:""});
            }} style={{background:"#a9646a",color:"white",border:"none",borderRadius:8,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Guardar</button>
          </div>
        </div>
      )}

      {inversiones.length===0 && <div style={{textAlign:"center",color:"#9a7878",padding:40,fontSize:13}}>No tenés inversiones cargadas aún</div>}
    </div>
  );
}
// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  // Inicializar con seed data de inmediato — sin esperar storage
  const [gastos, setGastos] = useState(SEED_GASTOS);
  const [ingresos, setIngresos] = useState(SEED_INGRESOS);
  const [saldos, setSaldos] = useState(SEED_SALDOS);
  const [inversiones, setInversiones] = useState(SEED_INVERSIONES);
  const [vencimientos, setVencimientos] = useState(SEED_VENCIMIENTOS);
  const [view, setView] = useState("dashboard");
  const [form, setForm] = useState(null);
  const [mesIdx, setMesIdx] = useState(5);
  const [search, setSearch] = useState("");
  const [filterCuenta, setFilterCuenta] = useState("Todas");
  const [loaded, setLoaded] = useState(true); // Ya cargado con seeds
  const [editSaldo, setEditSaldo] = useState(null);
  const [tipoCambio, setTipoCambio] = useState(1465);
  const [sheetsUrl, setSheetsUrl] = useState(() => localStorage.getItem('sheets_url') || '');
  const [showSheetsSetup, setShowSheetsSetup] = useState(false);
  const [sheetsSaved, setSheetsSaved] = useState(false);

  const saveSheetsUrl = (url) => {
    const trimmed = url.trim();
    localStorage.setItem('sheets_url', trimmed);
    setSheetsUrl(trimmed);
    setSheetsSaved(true);
    setTimeout(() => { setSheetsSaved(false); setShowSheetsSetup(false); }, 1500);
  };

  const mes = MESES[mesIdx];

  useEffect(() => {
    injectStyles();
    // Cargar storage en segundo plano y actualizar si hay datos guardados
    (async () => {
      try {
        const g = await load("gastos_v2", null); if(g) setGastos(g);
        const i = await load("ingresos_v2", null); if(i) setIngresos(i);
        const s = await load("saldos_v2", null); if(s) setSaldos(s);
        const inv = await load("inversiones_v3", null); if(inv) setInversiones(inv);
        const v = await load("vencimientos_v2", null); if(v) setVencimientos(v);
      } catch(e) {}
    })();
  }, []);

  useEffect(()=>{if(loaded)save("gastos_v2",gastos);},[gastos,loaded]);
  useEffect(()=>{if(loaded)save("ingresos_v2",ingresos);},[ingresos,loaded]);
  useEffect(()=>{if(loaded)save("saldos_v2",saldos);},[saldos,loaded]);
  useEffect(()=>{if(loaded)save("inversiones_v3",inversiones);},[inversiones,loaded]);
  useEffect(()=>{if(loaded)save("vencimientos_v2",vencimientos);},[vencimientos,loaded]);

  const gastosMes = useMemo(()=>gastos.filter(g=>g.mes===mes),[gastos,mes]);
  const ingresosMes = useMemo(()=>ingresos.filter(i=>i.mes===mes),[ingresos,mes]);
  const totalGastos = useMemo(()=>gastosMes.reduce((s,g)=>s+g.valor,0),[gastosMes]);
  // Ingresos REALES: excluye "Mov. entre cuentas" (transferencias internas, no ingresos reales)
  const ingresosMesReal = useMemo(()=>ingresosMes.filter(i=>i.categoria!=="Mov. entre cuentas"),[ingresosMes]);
  const totalIngresos = useMemo(()=>ingresosMesReal.reduce((s,i)=>s+i.valor,0),[ingresosMesReal]);
  const balance = totalIngresos - totalGastos;

  const lineData = useMemo(()=>MESES.map(m=>({
    mes:m.slice(0,3),
    Ingresos:ingresos.filter(i=>i.mes===m&&i.categoria!=="Mov. entre cuentas").reduce((s,i)=>s+i.valor,0),
    Gastos:gastos.filter(g=>g.mes===m).reduce((s,g)=>s+g.valor,0),
  })),[gastos,ingresos]);

  // ALL categories (no slice limit)
  const catGastoData = useMemo(()=>{
    const map={};
    gastosMes.forEach(g=>{map[g.categoria]=(map[g.categoria]||0)+g.valor;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([cat,val],i)=>({cat,val,fill:CAT_COLORS[i%CAT_COLORS.length]}));
  },[gastosMes]);

  // Income categories - solo ingresos reales (sin mov. entre cuentas)
  const catIngresoData = useMemo(()=>{
    const map={};
    ingresosMesReal.forEach(i=>{map[i.categoria]=(map[i.categoria]||0)+i.valor;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([cat,val],i)=>({cat,val,fill:["#2d8b5a","#a9646a","#8B4A50","#E67700"][i%4]}));
  },[ingresosMesReal]);

  const accountBalances = useMemo(()=>CUENTAS.map(cuenta=>{
    const k=`${cuenta}-${mes}`;
    const sd=saldos[k]||{inicio:0,ajuste:0,nota:""};
    const ing=ingresosMes.filter(i=>i.cuenta===cuenta).reduce((s,i)=>s+i.valor,0);
    const gas=gastosMes.filter(g=>g.cuenta===cuenta).reduce((s,g)=>s+g.valor,0);
    return {cuenta,inicio:sd.inicio,ingresos:ing,gastos:gas,ajuste:sd.ajuste||0,nota:sd.nota||"",final:sd.inicio+ing-gas+(sd.ajuste||0)};
  }),[gastosMes,ingresosMes,saldos,mes]);

  const historial = useMemo(()=>{
    const all=[...gastos.map(g=>({...g,tipo:"gasto"})),...ingresos.map(i=>({...i,tipo:"ingreso"}))].filter(t=>t.mes===mes);
    return all.filter(t=>(!search||t.concepto.toLowerCase().includes(search.toLowerCase())||(t.comentario||"").toLowerCase().includes(search.toLowerCase()))&&(filterCuenta==="Todas"||t.cuenta===filterCuenta)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  },[gastos,ingresos,mes,search,filterCuenta]);

  const updateSaldo=(cuenta,field,value)=>{const k=`${cuenta}-${mes}`;setSaldos(prev=>({...prev,[k]:{...(prev[k]||{inicio:0,ajuste:0,nota:""}), [field]:value}}));};
  const alertasVenc = vencimientos.filter(v=>{const d=diasHasta(v.fecha);return d>=0&&d<=7;}).length;

  return (
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:"#f2e6dc",paddingBottom:90}}>

      {/* HEADER */}
      <div style={{background:"#fff",borderBottom:"1px solid #ead8d0",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:40,boxShadow:"0 2px 8px rgba(90,61,59,0.08)"}}>
        <div>
          <div style={{fontFamily:"Plus Jakarta Sans",fontSize:20,fontWeight:800,color:"#a9646a"}}>💰 Tracker</div>
          <div style={{fontSize:11,color:"#9a7878",fontWeight:500}}>Finanzas 2026</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"#f2e6dc",border:"1.5px solid #dcc8c0",borderRadius:12,padding:"7px 12px"}}>
            <button onClick={()=>setMesIdx(i=>Math.max(0,i-1))} style={{background:"none",border:"none",color:"#9a7878",cursor:"pointer",display:"flex",padding:2}}><ChevronLeft size={15}/></button>
            <span style={{fontFamily:"Plus Jakarta Sans",fontSize:13,fontWeight:700,color:"#a9646a",minWidth:56,textAlign:"center"}}>{mes}</span>
            <button onClick={()=>setMesIdx(i=>Math.min(11,i+1))} style={{background:"none",border:"none",color:"#9a7878",cursor:"pointer",display:"flex",padding:2}}><ChevronRight size={15}/></button>
          </div>
          <button onClick={()=>setShowSheetsSetup(v=>!v)} title="Configurar Google Sheets" style={{background: sheetsUrl ? "#eef8f2" : "#f2e6dc", border:`1.5px solid ${sheetsUrl?"#2d8b5a":"#dcc8c0"}`,borderRadius:10,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
            {sheetsUrl ? "✅" : "📊"}
          </button>
        </div>
      </div>

      {/* ── DASHBOARD ── */}
      {view==="dashboard" && (
        <div className="fade-in" style={{padding:"14px 14px 0"}}>
          {/* Summary */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            {[{label:"Ingresos",val:totalIngresos,color:"#2d8b5a",bg:"#eef8f2"},{label:"Gastos",val:totalGastos,color:"#c04848",bg:"#fdf0f0"},{label:"Balance",val:balance,color:balance>=0?"#a9646a":"#c04848",bg:balance>=0?"#f5e8e4":"#fdf0f0"}].map(c=>(
              <div key={c.label} style={{background:c.bg,borderRadius:14,padding:"14px 10px",border:`1px solid ${c.color}22`}}>
                <div style={{fontSize:10,color:c.color,fontWeight:700,marginBottom:4}}>{c.label}</div>
                <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:800,color:c.color}}>{fmtShort(c.val)}</div>
                <div style={{fontSize:9,color:c.color,opacity:0.7,marginTop:3,fontWeight:500}}>{fmt(c.val)}</div>
              </div>
            ))}
          </div>

          {/* Vencimientos Alert */}
          {alertasVenc>0 && (
            <div style={{background:"#fdf0f0",border:"1px solid #FFB3B3",borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
              <AlertTriangle size={18} color="#c04848"/>
              <div>
                <div style={{fontFamily:"Plus Jakarta Sans",fontSize:13,fontWeight:700,color:"#c04848"}}>⚠️ {alertasVenc} vencimiento{alertasVenc>1?"s":""} en los próximos 7 días</div>
                <div style={{fontSize:11,color:"#9a7878",marginTop:2}}>Revisá la sección de vencimientos</div>
              </div>
            </div>
          )}

          {/* Line chart */}
          <div className="card" style={{padding:"16px 10px 12px",marginBottom:12}}>
            <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,marginBottom:4,color:"#3d2825",paddingLeft:6}}>Evolución anual</div>
            <div style={{display:"flex",gap:16,paddingLeft:6,marginBottom:12}}>
              {[["Ingresos","#2d8b5a"],["Gastos","#c04848"]].map(([l,c])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:20,height:2.5,background:c,borderRadius:2}}/><span style={{fontSize:11,color:"#9a7878",fontWeight:600}}>{l}</span></div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lineData} margin={{left:-10,right:10,top:5,bottom:0}}>
                <CartesianGrid stroke="#f2e6dc" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="mes" tick={{fontSize:10,fill:"#9a7878"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#9a7878"}} axisLine={false} tickLine={false} tickFormatter={v=>v===0?"0":fmtShort(v)}/>
                <Tooltip content={<LTip/>}/>
                <Line type="monotone" dataKey="Ingresos" stroke="#2d8b5a" strokeWidth={2.5} dot={{r:3,fill:"#2d8b5a",strokeWidth:0}} activeDot={{r:5}}/>
                <Line type="monotone" dataKey="Gastos" stroke="#c04848" strokeWidth={2.5} dot={{r:3,fill:"#c04848",strokeWidth:0}} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gastos por categoría — ALL */}
          {catGastoData.length>0 && (
            <div className="card" style={{padding:"16px 10px 12px",marginBottom:12}}>
              <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,marginBottom:12,color:"#3d2825",paddingLeft:6}}>🔴 Gastos por categoría — {mes}</div>
              <ResponsiveContainer width="100%" height={Math.max(180,catGastoData.length*32)}>
                <BarChart data={catGastoData} layout="vertical" margin={{left:0,right:30,top:0,bottom:0}}>
                  <XAxis type="number" hide/>
                  <YAxis type="category" dataKey="cat" width={105} tick={{fill:"#5C6E8A",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${CAT_EMOJI[v]||""} ${v}`}/>
                  <Tooltip content={<CTip/>} cursor={{fill:"rgba(90,61,59,0.05)"}}/>
                  <Bar dataKey="val" radius={[0,6,6,0]}>{catGastoData.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Ingresos por categoría */}
          {catIngresoData.length>0 && (
            <div className="card" style={{padding:"16px 10px 12px",marginBottom:12}}>
              <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,marginBottom:12,color:"#3d2825",paddingLeft:6}}>🟢 Ingresos por categoría — {mes}</div>
              <ResponsiveContainer width="100%" height={Math.max(100,catIngresoData.length*40)}>
                <BarChart data={catIngresoData} layout="vertical" margin={{left:0,right:30,top:0,bottom:0}}>
                  <XAxis type="number" hide/>
                  <YAxis type="category" dataKey="cat" width={130} tick={{fill:"#5C6E8A",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${CAT_EMOJI[v]||""} ${v}`}/>
                  <Tooltip content={<CTip/>} cursor={{fill:"rgba(12,166,120,0.04)"}}/>
                  <Bar dataKey="val" radius={[0,6,6,0]}>{catIngresoData.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Vencimientos */}
          <VencimientosCard vencimientos={vencimientos} onAdd={v=>setVencimientos(prev=>[...prev,v])} onDel={id=>setVencimientos(prev=>prev.filter(v=>v.id!==id))}/>

          {/* Account balances */}
          <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,marginBottom:10,color:"#3d2825"}}>Saldos por Cuenta</div>
          {accountBalances.filter(a=>a.inicio>0||a.ingresos>0||a.gastos>0).map(a=>(
            <div key={a.cuenta} className="card-sm" style={{padding:"14px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:CUENTA_COLOR[a.cuenta]}}/>
                  <div>
                    <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,color:"#3d2825"}}>{a.cuenta}</div>
                    <div style={{fontSize:11,color:"#9a7878"}}>Inicio: {fmtShort(a.inicio)}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"Plus Jakarta Sans",fontSize:16,fontWeight:800,color:a.final>=0?"#2d8b5a":"#c04848"}}>{fmtShort(a.final)}</div>
                  <div style={{fontSize:11,color:a.ingresos-a.gastos>=0?"#2d8b5a":"#c04848"}}>{a.ingresos-a.gastos>=0?"+":""}{fmtShort(a.ingresos-a.gastos)}</div>
                </div>
              </div>
              {editSaldo===a.cuenta && (
                <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8,paddingTop:12,borderTop:"1px solid #ead8d0"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div><div style={{fontSize:11,color:"#9a7878",marginBottom:4,fontWeight:600}}>Saldo Inicio</div><input className="input-field" type="number" style={{fontSize:12,padding:"8px 10px"}} value={a.inicio} onChange={e=>updateSaldo(a.cuenta,"inicio",parseFloat(e.target.value)||0)}/></div>
                    <div><div style={{fontSize:11,color:"#9a7878",marginBottom:4,fontWeight:600}}>Ajuste</div><input className="input-field" type="number" style={{fontSize:12,padding:"8px 10px"}} value={a.ajuste} onChange={e=>updateSaldo(a.cuenta,"ajuste",parseFloat(e.target.value)||0)}/></div>
                  </div>
                  <input className="input-field" style={{fontSize:12,padding:"8px 10px"}} placeholder="Nota del ajuste..." value={a.nota} onChange={e=>updateSaldo(a.cuenta,"nota",e.target.value)}/>
                  <button onClick={()=>setEditSaldo(null)} style={{background:"#eef8f2",border:"1px solid #2d8b5a",color:"#2d8b5a",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:700}}>✓ Listo</button>
                </div>
              )}
              <button onClick={()=>setEditSaldo(editSaldo===a.cuenta?null:a.cuenta)} style={{marginTop:10,background:"#faf3ee",border:"1px solid #dcc8c0",borderRadius:8,color:"#9a7878",padding:"6px 12px",cursor:"pointer",fontSize:11,width:"100%",fontWeight:600}}>✏️ Editar saldo inicio / ajuste</button>
            </div>
          ))}

          {/* Recent */}
          <div style={{fontFamily:"Plus Jakarta Sans",fontSize:14,fontWeight:700,margin:"14px 0 10px",color:"#3d2825"}}>Últimas transacciones</div>
          {[...gastos.filter(g=>g.mes===mes),...ingresos.filter(i=>i.mes===mes)].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,5).map(t=>(
            <div key={t.id} className="card-sm" style={{padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:20}}>{CAT_EMOJI[t.categoria]||"📌"}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#3d2825"}}>{t.concepto}</div>
                  <div style={{fontSize:11,color:"#9a7878"}}>{t.cuenta} · {t.fecha.slice(5).replace("-","/")}</div>
                </div>
              </div>
              <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:14,color:t.tipo==="ingreso"?"#2d8b5a":"#c04848"}}>
                {t.tipo==="ingreso"?"+":"-"}{fmtShort(t.valor)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── INVERSIONES ── */}
      {view==="inversiones" && (
        <InversionesView inversiones={inversiones} onAdd={i=>setInversiones(prev=>[...prev,i])} onDel={id=>setInversiones(prev=>prev.filter(i=>i.id!==id))} tipoCambio={tipoCambio} onTipoCambioFetched={setTipoCambio}/>
      )}

      {/* ── HISTORIAL ── */}
      {view==="historial" && (
        <div className="fade-in" style={{padding:"14px 14px 0"}}>
          <div style={{fontFamily:"Plus Jakarta Sans",fontSize:18,fontWeight:800,marginBottom:12,color:"#3d2825"}}>📋 Historial — {mes}</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{position:"relative",flex:1}}>
              <Search size={14} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#9a7878"}}/>
              <input className="input-field" style={{paddingLeft:32,fontSize:13}} placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="input-field" style={{width:100,fontSize:12,padding:"8px 10px"}} value={filterCuenta} onChange={e=>setFilterCuenta(e.target.value)}>
              <option>Todas</option>
              {CUENTAS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{fontSize:12,color:"#9a7878",marginBottom:10,fontWeight:500}}>
            {historial.length} movimientos · <span style={{color:"#c04848"}}>Gastos: {fmtShort(historial.filter(t=>t.tipo==="gasto").reduce((s,t)=>s+t.valor,0))}</span> · <span style={{color:"#2d8b5a"}}>Ingresos reales: {fmtShort(historial.filter(t=>t.tipo==="ingreso"&&t.categoria!=="Mov. entre cuentas").reduce((s,t)=>s+t.valor,0))}</span>
          </div>
          {historial.map(t=>(
            <div key={t.id} className="card-sm" style={{padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                <div style={{fontSize:18,flexShrink:0}}>{CAT_EMOJI[t.categoria]||"📌"}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#3d2825",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.concepto}</div>
                  <div style={{fontSize:11,color:"#9a7878"}}>{t.cuenta} · {t.categoria} · {t.fecha.slice(5).replace("-","/")}</div>
                  {t.comentario&&<div style={{fontSize:11,color:"#A0AABB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.comentario}</div>}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:13,color:t.tipo==="ingreso"?"#2d8b5a":"#c04848"}}>{t.tipo==="ingreso"?"+":"-"}{fmtShort(t.valor)}</div>
                <button onClick={()=>t.tipo==="gasto"?setGastos(p=>p.filter(g=>g.id!==t.id)):setIngresos(p=>p.filter(i=>i.id!==t.id))} style={{background:"none",border:"none",color:"#C5D0E8",cursor:"pointer",display:"flex",padding:4}}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
          {historial.length===0&&<div style={{textAlign:"center",color:"#9a7878",padding:40,fontSize:13}}>No hay transacciones</div>}
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"#fff",borderTop:"1px solid #ead8d0",display:"flex",alignItems:"center",zIndex:50,boxShadow:"0 -2px 12px rgba(90,61,59,0.08)"}}>
        <button className={`tab-btn ${view==="dashboard"?"active":""}`} onClick={()=>setView("dashboard")}>
          <LayoutDashboard size={18}/><span>Inicio</span>
        </button>
        <button className="tab-btn" onClick={()=>setForm("gasto")} style={{color:"#c04848"}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:"#c04848",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:-4,boxShadow:"0 4px 12px rgba(192,72,72,0.35)"}}>
            <Minus size={20} color="white"/>
          </div>
          <span style={{marginTop:2}}>Gasto</span>
        </button>
        <button className="tab-btn" onClick={()=>setForm("ingreso")} style={{color:"#2d8b5a"}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:"#2d8b5a",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:-4,boxShadow:"0 4px 12px rgba(12,166,120,0.3)"}}>
            <Plus size={20} color="white"/>
          </div>
          <span style={{marginTop:2}}>Ingreso</span>
        </button>
        <button className={`tab-btn ${view==="inversiones"?"active":""}`} onClick={()=>setView("inversiones")}>
          <div style={{position:"relative"}}>
            <TrendingUp size={18}/>
          </div>
          <span>Inversiones</span>
        </button>
        <button className={`tab-btn ${view==="historial"?"active":""}`} onClick={()=>setView("historial")}>
          <div style={{position:"relative"}}>
            <List size={18}/>
          </div>
          <span>Historial</span>
        </button>
      </div>

      {form && <TransactionForm
        type={form}
        onSave={form==="gasto"
          ? g => { setGastos(p=>[g,...p]); syncToSheets(g,'gasto'); }
          : i => { setIngresos(p=>[i,...p]); syncToSheets(i,'ingreso'); }
        }
        onClose={()=>setForm(null)}
        selectedMes={mes}
      />}

      {/* ── SHEETS SETUP MODAL ── */}
      {showSheetsSetup && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,32,53,0.5)",zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end",backdropFilter:"blur(4px)"}} onClick={()=>setShowSheetsSetup(false)}>
          <div className="fade-in" style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px",maxHeight:"60vh"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontFamily:"Plus Jakarta Sans",fontSize:18,fontWeight:800,color:"#3d2825"}}>📊 Google Sheets</div>
                <div style={{fontSize:12,color:"#9a7878",marginTop:2}}>Sincronizá gastos e ingresos automáticamente</div>
              </div>
              <button onClick={()=>setShowSheetsSetup(false)} style={{background:"#f2e6dc",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={16}/></button>
            </div>

            <div style={{background:"#faf3ee",borderRadius:12,padding:"12px 14px",marginBottom:16,fontSize:12,color:"#5a3d3b",lineHeight:1.6}}>
              <div style={{fontWeight:700,marginBottom:4}}>¿Cómo configurarlo?</div>
              <div>1. Creá un Google Sheet nuevo</div>
              <div>2. Abrí <b>Extensiones → Apps Script</b></div>
              <div>3. Pegá el código del archivo <b>Code.gs</b> que te generé</div>
              <div>4. Hacé clic en <b>Implementar → Nueva implementación</b></div>
              <div>5. Tipo: <b>Aplicación web</b> · Acceso: <b>Cualquiera</b></div>
              <div>6. Copiá la URL que te da y pegala abajo</div>
            </div>

            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"#9a7878",marginBottom:6,fontWeight:600}}>URL del Web App</div>
              <input
                className="input-field"
                placeholder="https://script.google.com/macros/s/..."
                value={sheetsUrl}
                onChange={e=>setSheetsUrl(e.target.value)}
                style={{fontSize:13}}
              />
            </div>

            {sheetsSaved
              ? <div style={{background:"#eef8f2",border:"1px solid #2d8b5a",borderRadius:12,padding:"14px",textAlign:"center",fontSize:14,fontWeight:700,color:"#2d8b5a"}}>✓ ¡Conectado! Los próximos gastos/ingresos se guardarán en tu Sheet</div>
              : <button onClick={()=>saveSheetsUrl(sheetsUrl)} style={{background:"#a9646a",color:"white",border:"none",borderRadius:12,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%"}}>Guardar y conectar</button>
            }

            {sheetsUrl && !sheetsSaved && (
              <button onClick={()=>{ localStorage.removeItem('sheets_url'); setSheetsUrl(''); setShowSheetsSetup(false); }} style={{marginTop:8,background:"none",border:"none",color:"#c04848",fontSize:12,cursor:"pointer",width:"100%",padding:"8px"}}>
                Desconectar Sheets
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
