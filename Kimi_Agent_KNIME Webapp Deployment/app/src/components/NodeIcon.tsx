import {
  FileSpreadsheet,
  Filter,
  Calculator,
  Group,
  GitBranch,
  Type,
  ArrowUpDown,
  CopyX,
  Combine,
  Hash,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileSpreadsheet,
  Filter,
  Calculator,
  Group,
  GitBranch,
  Type,
  ArrowUpDown,
  CopyX,
  Combine,
  Hash,
};

interface NodeIconProps {
  name: string;
  className?: string;
}

export default function NodeIcon({ name, className = 'w-6 h-6' }: NodeIconProps) {
  const Icon = iconMap[name];
  if (!Icon) return <div className={className} />;
  return <Icon className={className} />;
}
