/**
 * Results visualization with charts and export
 * Shows prediction history, metrics, and confusion matrix
 */
import { Card } from "@/components/user-interface/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from "recharts";
import { Download } from "lucide-react";
import { Button } from "@/components/user-interface/button";
import { toast } from "sonner";

interface ResultsVisualizationProps {
  predictions: any[];
  metrics: any;
}

// colors for the charts - using semantic tokens from design system
const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--success))", "hsl(var(--warning))"];

const ResultsVisualization = ({ predictions, metrics }: ResultsVisualizationProps) => {
  // nothing to show if no predictions yet
  if(predictions.length === 0) return null;
  
  // console.log("Rendering results for", predictions.length, "predictions");

  // get all unique classes (should refactor this to use reduce maybe?)
  const allClasses = [...new Set(predictions.map(p => p.prediction))];
  
  // transform prediction data for charts
  // TODO: clean this up later
  const predictionHistory = predictions.map((pred, idx) => {
    return {
      id: idx + 1,
      predictionValue: pred.predictionValue,
      confidence: pred.confidence * 100,
      class: pred.prediction,
    };
  });

  // count how many of each class - doing it manually for clarity
  const classDistribution = allClasses.map(cls => {
    let countForThisClass = 0;
    for(let i = 0; i < predictions.length; i++) {
      if(predictions[i].prediction === cls) {
        countForThisClass++;
      }
    }
    
    return {
      name: String(cls),
      value: countForThisClass,
    };
  });

  // export to CSV file
  // copied from https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
  const handleExport = () => {
    if(predictions.length === 0) return;
    
    // get column names from first prediction
    const inputKeys = Object.keys(predictions[0].inputs || {});
    const headers = ["Timestamp", ...inputKeys, "Prediction", "Confidence %"];
    
    // build CSV string
    let csvContent = headers.join(",") + "\n";
    
    for(let i = 0; i < predictions.length; i++) {
      const p = predictions[i];
      let row = [p.timestamp];
      
      // add input values
      for(let j = 0; j < inputKeys.length; j++) {
        row.push(p.inputs[inputKeys[j]]);
      }
      
      // add prediction and confidence
      row.push(p.prediction);
      row.push((p.confidence * 100).toFixed(1));
      
      csvContent = csvContent + row.join(",") + "\n";
    }

    // trigger download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "predictions.csv";
    a.click();
    
    toast.success("Predictions exported");
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">Results</h3>
            <p className="text-xs text-muted-foreground">
              {predictions.length} predictions
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-3 h-3 mr-2" />
            Export
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Confidence Trend</p>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictionHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="id"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Confidence %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Class Distribution</p>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {classDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Recent</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-2 font-medium text-muted-foreground">Time</th>
                <th className="pb-2 font-medium text-muted-foreground">Prediction</th>
                <th className="pb-2 font-medium text-muted-foreground">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {predictions.slice(-5).reverse().map((pred, idx) => (
                <tr key={idx} className="border-b border-border/50">
                  <td className="py-2 text-muted-foreground">{pred.timestamp}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                      {pred.prediction}
                    </span>
                  </td>
                  <td className="py-2 font-medium">
                    {(pred.confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {metrics && (
        <>
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Performance</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="text-sm font-medium mt-1">{metrics.accuracy.toFixed(1)}%</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Precision</p>
                <p className="text-sm font-medium mt-1">{metrics.precision.toFixed(1)}%</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Recall</p>
                <p className="text-sm font-medium mt-1">{metrics.recall.toFixed(1)}%</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">F1</p>
                <p className="text-sm font-medium mt-1">{metrics.f1Score.toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          {metrics.confusionMatrix && (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Confusion Matrix</h3>
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                <div className="text-center p-3 bg-success/20 border border-success/50 rounded">
                  <p className="text-xs text-muted-foreground">True Negative</p>
                  <p className="text-lg font-bold">{metrics.confusionMatrix.tn}</p>
                </div>
                <div className="text-center p-3 bg-destructive/20 border border-destructive/50 rounded">
                  <p className="text-xs text-muted-foreground">False Positive</p>
                  <p className="text-lg font-bold">{metrics.confusionMatrix.fp}</p>
                </div>
                <div className="text-center p-3 bg-destructive/20 border border-destructive/50 rounded">
                  <p className="text-xs text-muted-foreground">False Negative</p>
                  <p className="text-lg font-bold">{metrics.confusionMatrix.fn}</p>
                </div>
                <div className="text-center p-3 bg-success/20 border border-success/50 rounded">
                  <p className="text-xs text-muted-foreground">True Positive</p>
                  <p className="text-lg font-bold">{metrics.confusionMatrix.tp}</p>
                </div>
              </div>
            </Card>
          )}

          {metrics.rocCurve && (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">ROC Curve (AUC: {metrics.auc?.toFixed(3)})</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      dataKey="fpr" 
                      name="False Positive Rate"
                      domain={[0, 1]}
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: "False Positive Rate", position: "insideBottom", offset: -10 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="tpr" 
                      name="True Positive Rate"
                      domain={[0, 1]}
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: "True Positive Rate", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Scatter data={metrics.rocCurve} fill="hsl(var(--primary))" line={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }} />
                    <Scatter data={[{fpr: 0, tpr: 0}, {fpr: 1, tpr: 1}]} fill="none" line={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ResultsVisualization;
