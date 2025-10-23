// shows which features matter most for predictions
import { Card } from "@/components/user-interface/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface FeatureImportanceProps {
  data: Array<{ feature: string; importance: number }>;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--info))",
];

const FeatureImportance = ({ data }: FeatureImportanceProps) => {
  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium">Feature Importance</h3>
        <p className="text-xs text-muted-foreground">
          Impact on predictions
        </p>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
            <YAxis
              dataKey="feature"
              type="category"
              stroke="hsl(var(--muted-foreground))"
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </Card>
  );
};

export default FeatureImportance;
