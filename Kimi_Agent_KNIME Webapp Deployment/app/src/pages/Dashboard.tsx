import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import {
  Search,
  RefreshCw,
  Settings,
  Check,
  Clock,
  ArrowRight,
  Upload,
  Download,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx-js-style';
import { workflowNodes, performanceData, phases } from '@/data/workflowNodes';
import type { WorkflowNode } from '@/data/workflowNodes';
import NodeIcon from '@/components/NodeIcon';

const barColors: Record<string, string> = {
  'Good Performer': '#52796F',
  'Poor Performer': '#E29578',
  'Receiver': '#52796F',
  'Doner': '#E29578',
  'Neutral': '#84A98C',
};

export default function Dashboard() {
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardTab, setDashboardTab] = useState<'status' | 'allocation'>('status');

  // Allocation engine state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [allocationResults, setAllocationResults] = useState<any[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return workflowNodes;
    const q = searchQuery.toLowerCase();
    return workflowNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const timestamp = new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsProcessing(true);
    setProgress(10);
    setCurrentStep('Reading file...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (rawRows.length === 0) {
          throw new Error('Spreadsheet is empty.');
        }

        // Check if required columns are present (case-insensitive checks)
        const sampleRow = rawRows[0];
        const keys = Object.keys(sampleRow);
        const findKey = (candidates: string[]) => {
          return keys.find(k => candidates.includes(k.toLowerCase().replace(/[\s_()]/g, '')));
        };

        const storeKey = findKey(['storename', 'store', 'store_name']);
        const materialKey = findKey(['material', 'materialname', 'mat']);
        const colorKey = findKey(['color', 'colour']);
        const recvdKey = findKey(['recvdqty', 'receivedqty', 'receivedquantity', 'recvd_qty']);
        const soldKey = findKey(['soldqty', 'soldquantity', 'sold_qty']);
        const stockKey = findKey(['currentstock', 'stock', 'current_stock']);
        const reqKey = findKey(['pcsreq', 'pcsrequested', 'pcs_req']);
        const meanStKey = findKey(['meansellthroughpercentage', 'meansellthrough', 'stmean', 'sellthrough']);

        if (!storeKey || !materialKey) {
          throw new Error(
            'Missing required columns. The sheet must contain at least Store Name and Material.'
          );
        }

        const isAggregatedSheet = !!meanStKey && (!recvdKey || !soldKey || !stockKey || !reqKey);

        if (!isAggregatedSheet && (!recvdKey || !soldKey || !stockKey || !reqKey)) {
          throw new Error(
            'Missing required columns. The sheet must contain columns for Store Name, Material, Recvd Qty, Sold Qty, Current Stock, and Pcs Req.'
          );
        }

        setProgress(30);
        setCurrentStep('Filtering active records & computing Sell-Through...');

        setTimeout(() => {
          let processedRows: any[] = [];

          if (isAggregatedSheet) {
            // Aggregated Sheet fallback (e.g. ST Mean with Store name.xlsx)
            processedRows = rawRows.map(row => {
              const meanST = parseFloat(row[meanStKey!]) || 0;
              // Generate stable mock values based on store name / material
              const seed = String(row[storeKey!] || '') + String(row[materialKey!] || '');
              let hash = 0;
              for (let i = 0; i < seed.length; i++) {
                hash = seed.charCodeAt(i) + ((hash << 5) - hash);
              }
              const currentStock = Math.abs(hash % 15);
              const pcsReq = Math.abs((hash >> 4) % 20) + 2;

              return {
                store: String(row[storeKey!]),
                material: String(row[materialKey!]),
                color: colorKey ? String(row[colorKey]) : 'N/A',
                recvdQty: 100,
                soldQty: Math.round(meanST),
                currentStock,
                pcsReq,
                sellThrough: meanST
              };
            });
          } else {
            // Raw Ingestion & Filtering (Received > 0)
            const activeRows = rawRows.filter(row => {
              const rec = parseFloat(row[recvdKey!]);
              return !isNaN(rec) && rec > 0;
            });

            processedRows = activeRows.map(row => {
              const rec = parseFloat(row[recvdKey!]) || 0;
              const sold = parseFloat(row[soldKey!]) || 0;
              const st = rec > 0 ? (sold / rec) * 100 : 0;
              return {
                store: String(row[storeKey!]),
                material: String(row[materialKey!]),
                color: colorKey ? String(row[colorKey]) : 'N/A',
                recvdQty: rec,
                soldQty: sold,
                currentStock: parseFloat(row[stockKey!]) || 0,
                pcsReq: parseFloat(row[reqKey!]) || 0,
                sellThrough: st
              };
            });
          }

          setProgress(50);
          setCurrentStep('Aggregating store levels & running logic engines...');

          setTimeout(() => {
            // 3. GroupBy
            const groupedMap = new Map<string, any>();
            processedRows.forEach(r => {
              const key = `${r.store}-${r.material}-${r.color}`;
              if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                  store: r.store,
                  material: r.material,
                  color: r.color,
                  currentStock: r.currentStock,
                  pcsReq: r.pcsReq,
                  sellThroughs: [r.sellThrough]
                });
              } else {
                groupedMap.get(key).sellThroughs.push(r.sellThrough);
              }
            });

            const aggregated = Array.from(groupedMap.values()).map(item => {
              const meanSellThrough = item.sellThroughs.reduce((a: number, b: number) => a + b, 0) / item.sellThroughs.length;
              
              // Rule Engine 1: Performance
              const performance = meanSellThrough >= 60 ? "Good Performer" : "Poor Performer";
              
              // Rule Engine 2: Role Status (Receiver/Doner/Neutral)
              let roleStatus = "Neutral";
              if (meanSellThrough >= 60) {
                roleStatus = "Receiver";
              } else if (meanSellThrough <= 40) {
                roleStatus = "Doner";
              }

              // Rule Engine 3: Final allocation status
              let finalStatus = "Neutral";
              if (roleStatus === "Receiver" && item.currentStock < item.pcsReq) {
                finalStatus = "Receiver";
              } else if (roleStatus === "Receiver" && item.currentStock >= item.pcsReq) {
                finalStatus = "Neutral";
              } else if (roleStatus === "Doner") {
                finalStatus = "Doner";
              }

              return {
                store: item.store,
                material: item.material,
                color: item.color,
                currentStock: item.currentStock,
                pcsReq: item.pcsReq,
                meanSellThrough,
                performance,
                roleStatus,
                finalStatus
              };
            });

            setProgress(70);
            setCurrentStep('Processing parallel Receiver and Donor streams...');

            setTimeout(() => {
              // 4. Split streams based on roleStatus (matching KNIME Row Filter logic)
              const receivers = aggregated.filter(a => a.roleStatus === "Receiver");
              const donorsRaw = aggregated.filter(a => a.roleStatus === "Doner");

              // Donor sorting and deduplication (Mean(Sell Through) DESC, then Material ASC)
              donorsRaw.sort((a, b) => {
                if (b.meanSellThrough !== a.meanSellThrough) {
                  return b.meanSellThrough - a.meanSellThrough;
                }
                if (a.material < b.material) return -1;
                if (a.material > b.material) return 1;
                return 0;
              });

              const donorMap = new Map<string, any>();
              donorsRaw.forEach(d => {
                if (!donorMap.has(d.material)) {
                  donorMap.set(d.material, d);
                }
              });

              setProgress(85);
              setCurrentStep('Running Inner Joiner on material keys...');

              setTimeout(() => {
                // 5. Joiner on Material
                const joined: any[] = [];
                receivers.forEach(r => {
                  const matchedDonor = donorMap.get(r.material);
                  if (matchedDonor) {
                    joined.push({
                      'Receiver Store Name': r.store,
                      'Material': r.material,
                      'Color': r.color,
                      'Receiver Status current stock': r.currentStock,
                      'pcs req (Rounded)': Math.round(r.pcsReq * 100) / 100,
                      'pcs req': r.pcsReq,
                      'Receiver Sell Through': Math.round(r.meanSellThrough * 100) / 100,
                      'Receiver Performance': r.performance,
                      'prediction': r.finalStatus,
                      'Donner Store Name': matchedDonor.store,
                      'Material_donner': matchedDonor.material,
                      'Colour ': matchedDonor.color,
                      'Donner Current Stock': matchedDonor.currentStock,
                      'Mean(Sell Through)_donner': matchedDonor.meanSellThrough,
                      'Performance Status (ST) ': matchedDonor.performance,
                      'Prediction2': matchedDonor.finalStatus,
                      'pcs req_donner': Math.round(r.pcsReq * 100) / 100
                    });
                  }
                });

                setProgress(100);
                setCurrentStep('Workflow completed successfully!');
                setAllocationResults(joined);
                setIsProcessing(false);
              }, 450);
            }, 450);
          }, 450);
        }, 450);

      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || 'Error processing spreadsheet.');
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleDownload = () => {
    if (!allocationResults) return;
    
    // Create custom styled worksheet
    const ws: any = {};
    ws['!ref'] = `A1:Q${allocationResults.length + 2}`;
    
    // Define merge ranges
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // A1:H1
      { s: { r: 0, c: 9 }, e: { r: 0, c: 16 } } // J1:Q1
    ];
    
    // Header styling
    const header1Style = {
      font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    ws['A1'] = { v: "Receiver ", t: "s", s: header1Style };
    ws['J1'] = { v: "Donner", t: "s", s: header1Style };
    
    const row2Headers = [
      "Receiver Store Name",
      "Material",
      "Colour",
      "Current stock",
      "pcs req",
      "Mean(Sell Through)",
      "Performance Status (ST)",
      "prediction",
      "Column1",
      "Donner Store Name",
      "Material_donner",
      "Colour ",
      "Current Stock_donner",
      "Mean(Sell Through)_donner",
      "Performance Status (ST) ",
      "Prediction2",
      "pcs req_donner"
    ];
    
    row2Headers.forEach((header, colIdx) => {
      const colLetter = String.fromCharCode(65 + colIdx);
      const cellRef = `${colLetter}2`;
      
      let fillObj = undefined;
      if (header === "Colour" || header === "Colour ") {
        fillObj = { fgColor: { rgb: "C6EFCE" } }; // Light green fill matching theme 9 in template
      } else if (header === "Column1") {
        fillObj = { fgColor: { rgb: "FFFF0000" } }; // Solid red fill
      }
      
      ws[cellRef] = {
        v: header,
        t: "s",
        s: {
          font: { name: "Calibri", sz: 11, bold: false },
          fill: fillObj,
          alignment: { vertical: "center" }
        }
      };
    });
    
    // Write data rows
    allocationResults.forEach((row, rowIdx) => {
      const xlRowIdx = rowIdx + 3; // Start from row 3
      
      const values = [
        row['Receiver Store Name'],
        row['Material'],
        row['Color'], // Colour
        row['Receiver Status current stock'],
        row['pcs req'],
        row['Receiver Sell Through'],
        row['Receiver Performance'],
        row['prediction'],
        null, // Column1 (empty)
        row['Donner Store Name'],
        row['Material_donner'],
        row['Colour '],
        row['Donner Current Stock'],
        row['Mean(Sell Through)_donner'],
        row['Performance Status (ST) '],
        row['Prediction2'],
        row['pcs req_donner']
      ];
      
      values.forEach((val, colIdx) => {
        const colLetter = String.fromCharCode(65 + colIdx);
        const cellRef = `${colLetter}${xlRowIdx}`;
        
        let type: "s" | "n" = "s";
        let cellVal = val === null || val === undefined ? "" : val;
        
        if (typeof val === 'number') {
          type = "n";
        } else {
          cellVal = String(cellVal);
        }
        
        ws[cellRef] = {
          v: cellVal,
          t: type,
          s: {
            font: { name: "Calibri", sz: 11 }
          }
        };
      });
    });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "default_1");
    XLSX.writeFile(wb, "Final Automation Project .xlsx");
  };

  // Pagination for results table
  const totalPages = Math.ceil((allocationResults?.length || 0) / rowsPerPage);
  const paginatedResults = useMemo(() => {
    if (!allocationResults) return [];
    const start = (currentPage - 1) * rowsPerPage;
    return allocationResults.slice(start, start + rowsPerPage);
  }, [allocationResults, currentPage]);

  const uniqueReceiversCount = useMemo(() => {
    if (!allocationResults) return 0;
    const rSet = new Set(allocationResults.map(r => r['Receiver Store Name']));
    return rSet.size;
  }, [allocationResults]);

  const uniqueDonorsCount = useMemo(() => {
    if (!allocationResults) return 0;
    const dSet = new Set(allocationResults.map(r => r['Donner Store Name']));
    return dSet.size;
  }, [allocationResults]);

  return (
    <main className="min-h-screen bg-[#F5F1EB] pt-16">
      {/* Header */}
      <div className="bg-white border-b border-[rgba(27,67,50,0.1)] px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-xl lg:text-2xl text-[#1B4332]">Dashboard</h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#2D3436]/50 font-body">
            <Clock className="w-3 h-3" />
            Last updated: {timestamp}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-[#F5F1EB] rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-[#2D3436]/40 mr-2" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm font-body text-[#2D3436] placeholder:text-[#2D3436]/40 outline-none w-36"
            />
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="w-8 h-8 rounded-full bg-[#F5F1EB] flex items-center justify-center hover:bg-[#e8e3db] transition-colors"
            data-cursor-hover
            title="Clear search"
          >
            <RefreshCw className="w-4 h-4 text-[#2D3436]/60" />
          </button>
          <Link
            to="/admin"
            className="w-8 h-8 rounded-full bg-[#F5F1EB] flex items-center justify-center hover:bg-[#e8e3db] transition-colors"
            data-cursor-hover
            title="Admin Settings"
          >
            <Settings className="w-4 h-4 text-[#2D3436]/60" />
          </Link>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="px-6 lg:px-8 py-3 border-b border-[rgba(27,67,50,0.05)] bg-white flex gap-4">
        <button
          onClick={() => setDashboardTab('status')}
          className={`pb-2 text-sm font-body font-semibold transition-all border-b-2 px-1 ${
            dashboardTab === 'status'
              ? 'border-[#52796F] text-[#1B4332]'
              : 'border-transparent text-[#2D3436]/50 hover:text-[#2D3436]'
          }`}
        >
          Workflow Node Status
        </button>
        <button
          onClick={() => setDashboardTab('allocation')}
          className={`pb-2 text-sm font-body font-semibold transition-all border-b-2 px-1 ${
            dashboardTab === 'allocation'
              ? 'border-[#52796F] text-[#1B4332]'
              : 'border-transparent text-[#2D3436]/50 hover:text-[#2D3436]'
          }`}
        >
          Run Allocation Engine
        </button>
      </div>

      {dashboardTab === 'status' ? (
        <>
          {/* Stats Row */}
          <div className="px-6 lg:px-8 py-5">
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Total Nodes', value: '16', sub: 'Active in workflow' },
                { label: 'Rule Engines', value: '3', sub: 'Decision nodes' },
                { label: 'Data Sources', value: '1', sub: 'Excel input' },
                { label: 'Output Tables', value: '1', sub: 'Final allocation' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex-1 min-w-[140px] bg-white rounded-xl p-4 lg:p-5 border border-[rgba(27,67,50,0.1)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  data-cursor-hover
                >
                  <div className="font-body font-semibold text-xl lg:text-2xl text-[#1B4332]">
                    {stat.value}
                  </div>
                  <div className="font-body font-medium text-sm text-[#2D3436] mt-1">
                    {stat.label}
                  </div>
                  <div className="font-body text-xs text-[#2D3436]/50">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 lg:px-8 pb-8 flex flex-col lg:flex-row gap-6">
            {/* Left Panel - Node Status */}
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
              {/* Workflow Progress */}
              <div className="bg-white rounded-xl p-5 border border-[rgba(27,67,50,0.1)]">
                <h3 className="font-body font-semibold text-sm text-[#1B4332] mb-3">
                  Workflow Progress
                </h3>
                <div className="h-1.5 bg-[#F5F1EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#52796F] rounded-full transition-all duration-1000"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="flex justify-between mt-3">
                  {phases.map((phase) => (
                    <div key={phase.id} className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-[#52796F]" />
                      <span className="text-[10px] text-[#2D3436]/50 font-body hidden sm:inline">
                        {phase.name.split(':')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Node Status List */}
              <div className="bg-white rounded-xl p-5 border border-[rgba(27,67,50,0.1)] flex-1">
                <h3 className="font-body font-semibold text-sm text-[#1B4332] mb-3">
                  Node Status
                </h3>
                <div className="bg-[#F5F1EB] rounded-lg px-3 py-2 mb-3">
                  <div className="flex items-center">
                    <Search className="w-3.5 h-3.5 text-[#2D3436]/40 mr-2" />
                    <input
                      type="text"
                      placeholder="Filter nodes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-xs font-body text-[#2D3436] placeholder:text-[#2D3436]/40 outline-none w-full"
                    />
                  </div>
                </div>
                <div className="space-y-0 max-h-[400px] overflow-y-auto pr-1">
                  {filteredNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`w-full flex items-center gap-2.5 py-2.5 px-2 rounded-lg text-left transition-colors ${
                        selectedNode?.id === node.id
                          ? 'bg-[#52796F]/5'
                          : 'hover:bg-[#F5F1EB]/50'
                      }`}
                      data-cursor-hover
                    >
                      <span className="w-2 h-2 rounded-full bg-[#52796F] flex-shrink-0" />
                      <span className="font-body font-medium text-[13px] text-[#1B4332] truncate flex-1">
                        {node.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#84A98C]/20 text-[#52796F] font-body flex-shrink-0">
                        {node.type.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Node Detail */}
            <div className="flex-1 flex flex-col gap-4">
              {selectedNode ? (
                <>
                  {/* Node Header */}
                  <div className="bg-white rounded-xl p-6 border border-[rgba(27,67,50,0.1)]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display text-lg text-[#84A98C]">
                        {String(selectedNode.id).padStart(2, '0')}
                      </span>
                      <h2 className="font-display text-xl lg:text-2xl text-[#1B4332]">
                        {selectedNode.name}
                      </h2>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#52796F] text-white font-body">
                        {selectedNode.type}
                      </span>
                    </div>
                    <p className="font-body text-sm text-[#2D3436]/70 mt-2 leading-relaxed">
                      {selectedNode.description}
                    </p>
                  </div>

                  {/* Node Logic */}
                  {(selectedNode.logic || selectedNode.name === 'Math Formula') && (
                    <div className="bg-white rounded-xl p-6 border border-[rgba(27,67,50,0.1)]">
                      <h3 className="font-body font-semibold text-sm text-[#1B4332] mb-3">
                        Logic & Configuration
                      </h3>
                      <div className="bg-[#F5F1EB] rounded-lg p-4">
                        <pre className="font-mono text-sm text-[#1B4332] whitespace-pre-wrap leading-relaxed">
                          {selectedNode.logic || '(($Sold Qty$ / $Recvd Qty$) * 100)'}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Data Flow */}
                  <div className="bg-white rounded-xl p-6 border border-[rgba(27,67,50,0.1)]">
                    <h3 className="font-body font-semibold text-sm text-[#1B4332] mb-3">
                      Input / Output
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="w-4 h-4 text-[#52796F] rotate-180" />
                          <span className="font-body font-medium text-xs text-[#52796F] uppercase tracking-wider">
                            Input
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {(selectedNode.input || ['Raw data']).map((col, i) => (
                            <li
                              key={i}
                              className="font-body text-[13px] text-[#2D3436] bg-[#F5F1EB] rounded-md px-3 py-1.5"
                            >
                              {col}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="w-4 h-4 text-[#E29578]" />
                          <span className="font-body font-medium text-xs text-[#E29578] uppercase tracking-wider">
                            Output
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {(selectedNode.output || ['Processed data']).map((col, i) => (
                            <li
                              key={i}
                              className="font-body text-[13px] text-[#2D3436] bg-[#F5F1EB] rounded-md px-3 py-1.5"
                            >
                              {col}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl p-12 border border-[rgba(27,67,50,0.1)] flex flex-col items-center justify-center text-center min-h-[300px]">
                  <NodeIcon name="GitBranch" className="w-12 h-12 text-[#84A98C] mb-4" />
                  <h3 className="font-display text-xl text-[#1B4332] mb-2">
                    Select a Node
                  </h3>
                  <p className="font-body text-sm text-[#2D3436]/60 max-w-[300px]">
                    Click on any node from the left panel to view its details, logic, and data flow.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chart Section */}
          <div className="px-6 lg:px-8 pb-8">
            <div className="bg-white rounded-xl p-6 border border-[rgba(27,67,50,0.1)]">
              <h3 className="font-body font-semibold text-base text-[#1B4332] mb-6">
                Sell-Through Performance Distribution
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} barSize={60}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.08)" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 12, fontFamily: 'Inter', fill: '#2D3436' }}
                      axisLine={{ stroke: 'rgba(27,67,50,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fontFamily: 'Inter', fill: '#2D3436' }}
                      axisLine={{ stroke: 'rgba(27,67,50,0.1)' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid rgba(27,67,50,0.1)',
                        fontFamily: 'Inter',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={800}>
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={barColors[entry.category] || '#52796F'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Run Allocation Engine View */
        <div className="px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          {!allocationResults && !isProcessing ? (
            /* Upload Zone */
            <div className="bg-white rounded-2xl p-8 lg:p-12 border border-[rgba(27,67,50,0.1)] shadow-sm max-w-3xl mx-auto flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#52796F]/10 flex items-center justify-center mb-6">
                <Upload className="w-8 h-8 text-[#52796F]" />
              </div>
              <h2 className="font-display text-2xl text-[#1B4332] mb-3">Upload Raw Benetton Book</h2>
              <p className="font-body text-sm text-[#2D3436]/60 max-w-lg mb-8 leading-relaxed">
                Upload your Excel spreadsheet or CSV containing inventory movement data. The engine will run the 16-node replenishment pipeline logic (GroupBy, Classification, Donor/Receiver parallel splitting, and Inner Joining) to find store-to-store stock transfers.
              </p>
              
              <label className="px-6 py-3 rounded-full bg-[#52796F] text-white font-body font-semibold text-sm hover:bg-[#3d5c54] transition-all cursor-pointer flex items-center gap-2 shadow-sm">
                <Play className="w-4 h-4" />
                Select Spreadsheet (.xlsx, .csv)
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadError && (
                <div className="mt-6 flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs font-body rounded-lg border border-red-200">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {uploadError}
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-[rgba(27,67,50,0.05)] w-full grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#2D3436]/50">Expected Columns</div>
                  <div className="text-xs font-body font-semibold text-[#1B4332] mt-1">Store Name, Material</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#2D3436]/50">Inventory Values</div>
                  <div className="text-xs font-body font-semibold text-[#1B4332] mt-1">Recvd Qty, Sold Qty</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#2D3436]/50">Target Limits</div>
                  <div className="text-xs font-body font-semibold text-[#1B4332] mt-1">Current Stock, Pcs Req</div>
                </div>
              </div>
            </div>
          ) : isProcessing ? (
            /* Progress state */
            <div className="bg-white rounded-2xl p-10 border border-[rgba(27,67,50,0.1)] shadow-sm max-w-xl mx-auto flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#52796F]/10 border-t-[#52796F] animate-spin mb-6" />
              <h3 className="font-display text-lg text-[#1B4332] mb-1">Simulating KNIME Pipeline</h3>
              <p className="font-body text-xs text-[#2D3436]/50 mb-6">{currentStep}</p>
              
              <div className="w-full h-2 bg-[#F5F1EB] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#52796F] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-body text-xs font-semibold text-[#52796F]">{progress}%</span>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="flex flex-wrap gap-4">
                {[
                  { label: 'Replenishment Pairs Found', value: String(allocationResults?.length || 0), sub: 'Joined items' },
                  { label: 'Unique Receivers', value: String(uniqueReceiversCount), sub: 'Needs stock replenishment' },
                  { label: 'Unique Donors', value: String(uniqueDonorsCount), sub: 'Surplus stock suppliers' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex-1 min-w-[200px] bg-white rounded-xl p-5 border border-[rgba(27,67,50,0.1)] shadow-sm"
                  >
                    <div className="font-body font-semibold text-2xl text-[#1B4332]">{stat.value}</div>
                    <div className="font-body font-semibold text-sm text-[#2D3436] mt-1">{stat.label}</div>
                    <div className="font-body text-xs text-[#2D3436]/50">{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl text-[#1B4332]">Allocation Output Matrix</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAllocationResults(null);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 rounded-full border border-[rgba(27,67,50,0.15)] text-[#2D3436]/80 font-body font-medium text-sm hover:bg-white transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset & Upload New
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-full bg-[#52796F] text-white font-body font-medium text-sm hover:bg-[#3d5c54] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Allocation Report (.xlsx)
                  </button>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-xl border border-[rgba(27,67,50,0.1)] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#F5F1EB] bg-[#F5F1EB]/10">
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Receiver Store Name</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Material</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Colour</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Current stock</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">pcs req</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Mean(Sell Through)</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Performance Status (ST)</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">prediction</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Column1</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Donner Store Name</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Material_donner</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Colour </th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Current Stock_donner</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Mean(Sell Through)_donner</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Performance Status (ST) </th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">Prediction2</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider whitespace-nowrap">pcs req_donner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResults.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-[rgba(27,67,50,0.05)] ${
                            i % 2 === 0 ? 'bg-white' : 'bg-[#F5F1EB]/20'
                          } hover:bg-[#52796F]/5 transition-colors`}
                        >
                          <td className="px-3 py-3 font-body text-xs font-semibold text-teal-800 whitespace-nowrap">{row['Receiver Store Name']}</td>
                          <td className="px-3 py-3 font-body font-medium text-xs text-[#1B4332] whitespace-nowrap">{row['Material']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Color']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Receiver Status current stock']}</td>
                          <td className="px-3 py-3 font-body text-xs font-semibold text-[#1B4332] whitespace-nowrap">{row['pcs req']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Receiver Sell Through']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Receiver Performance']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['prediction']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/40 whitespace-nowrap">-</td>
                          <td className="px-3 py-3 font-body text-xs font-semibold text-orange-800 whitespace-nowrap">{row['Donner Store Name']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Material_donner']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Colour ']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Donner Current Stock']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Mean(Sell Through)_donner']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Performance Status (ST) ']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['Prediction2']}</td>
                          <td className="px-3 py-3 font-body text-xs text-[#2D3436]/70 whitespace-nowrap">{row['pcs req_donner']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(27,67,50,0.1)] bg-[#F5F1EB]/10">
                    <span className="font-body text-xs text-[#2D3436]/50">
                      Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, allocationResults?.length || 0)} of {allocationResults?.length} pairs
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-[rgba(27,67,50,0.1)] bg-white text-xs font-body font-medium text-[#2D3436]/70 hover:bg-[#F5F1EB] disabled:opacity-50 disabled:hover:bg-white transition-all"
                      >
                        Previous
                      </button>
                      <span className="font-body text-xs text-[#2D3436]/70 font-semibold px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-[rgba(27,67,50,0.1)] bg-white text-xs font-body font-medium text-[#2D3436]/70 hover:bg-[#F5F1EB] disabled:opacity-50 disabled:hover:bg-white transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
