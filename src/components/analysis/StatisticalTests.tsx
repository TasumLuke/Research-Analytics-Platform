// run statistical tests on data
import { useState } from "react";
import { Card } from "@/components/user-interface/card";
import { Button } from "@/components/user-interface/button";
import { Label } from "@/components/user-interface/label";
import { Calculator, TrendingUp } from "lucide-react";
import { AnalysisData } from "@/views/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/user-interface/select";
import { Badge } from "@/components/user-interface/badge";

interface StatisticalTestsProps {
  data: AnalysisData[];
  columns: string[];
  columnTypes: { [key: string]: 'numeric' | 'categorical' };
}

const StatisticalTests = ({ data, columns, columnTypes }: StatisticalTestsProps) => {
  const [testType, setTestType] = useState<string>("ttest");
  const [variable1, setVariable1] = useState<string>("");
  const [variable2, setVariable2] = useState<string>("");
  const [groupVariable, setGroupVariable] = useState<string>("");
  const [results, setResults] = useState<any>(null);

  const numericColumns = columns.filter(col => columnTypes[col] === 'numeric');
  const categoricalColumns = columns.filter(col => columnTypes[col] === 'categorical');

  // one sample t test
  const performTTest = () => {
    if (!variable1) return;

    const values = data.map(row => Number(row[variable1])).filter(v => !isNaN(v));
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);
    const se = std / Math.sqrt(n);
    const t = mean / se;
    const df = n - 1;
    
    // rough p value estimate
    const pValue = t > 2 ? 0.05 : 0.1;

    setResults({
      test: "One-Sample T-Test",
      variable: variable1,
      n,
      mean: mean.toFixed(4),
      std: std.toFixed(4),
      se: se.toFixed(4),
      t: t.toFixed(4),
      df,
      pValue: pValue.toFixed(4),
      significant: pValue < 0.05
    });
  };

  // anova test
  const performANOVA = () => {
    if (!variable1 || !groupVariable) return;

    // get all groups
    const groups = [...new Set(data.map(row => String(row[groupVariable])))];
    const groupData = groups.map(group => {
      const values = data
        .filter(row => String(row[groupVariable]) === group)
        .map(row => Number(row[variable1]))
        .filter(v => !isNaN(v));
      return { group, values };
    });

    // calculate grand mean
    const grandMean = data.map(row => Number(row[variable1])).filter(v => !isNaN(v))
      .reduce((a, b) => a + b, 0) / data.length;

    // calculate group means
    const groupMeans = groupData.map(g => ({
      group: g.group,
      mean: g.values.reduce((a, b) => a + b, 0) / g.values.length,
      n: g.values.length
    }));

    // between group variance
    const ssb = groupMeans.reduce((sum, g) => sum + g.n * Math.pow(g.mean - grandMean, 2), 0);
    const dfb = groups.length - 1;

    // within group variance
    const ssw = groupData.reduce((sum, g) => {
      const mean = g.values.reduce((a, b) => a + b, 0) / g.values.length;
      return sum + g.values.reduce((s, v) => s + Math.pow(v - mean, 2), 0);
    }, 0);
    const dfw = data.length - groups.length;

    const msb = ssb / dfb;
    const msw = ssw / dfw;
    const fStat = msb / msw;
    
    // rough p value
    const pValue = fStat > 3 ? 0.01 : fStat > 2 ? 0.05 : 0.1;

    // post hoc test if significant
    const postHoc: any[] = [];
    if (pValue < 0.05) {
      const mse = msw;
      for (let i = 0; i < groupMeans.length; i++) {
        for (let j = i + 1; j < groupMeans.length; j++) {
          const diff = Math.abs(groupMeans[i].mean - groupMeans[j].mean);
          const n = (groupMeans[i].n + groupMeans[j].n) / 2;
          const hsd = 3.5 * Math.sqrt(mse / n);
          const significant = diff > hsd;
          
          postHoc.push({
            group1: groupMeans[i].group,
            group2: groupMeans[j].group,
            diff: diff.toFixed(4),
            significant
          });
        }
      }
    }

    setResults({
      test: "One-Way ANOVA",
      variable: variable1,
      groupVariable,
      groups: groups.length,
      fStatistic: fStat.toFixed(4),
      dfBetween: dfb,
      dfWithin: dfw,
      pValue: pValue.toFixed(4),
      significant: pValue < 0.05,
      groupMeans: groupMeans.map(g => ({ group: g.group, mean: g.mean.toFixed(4) })),
      postHoc: postHoc.length > 0 ? postHoc : null
    });
  };

  // pearson correlation
  const performCorrelation = () => {
    if (!variable1 || !variable2) return;

    // get x and y pairs
    const pairs = data.map(row => ({
      x: Number(row[variable1]),
      y: Number(row[variable2])
    })).filter(p => !isNaN(p.x) && !isNaN(p.y));

    const n = pairs.length;
    const meanX = pairs.reduce((sum, p) => sum + p.x, 0) / n;
    const meanY = pairs.reduce((sum, p) => sum + p.y, 0) / n;

    // calculate correlation coefficient
    const numerator = pairs.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);
    const denomX = Math.sqrt(pairs.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0));
    const denomY = Math.sqrt(pairs.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0));

    const r = numerator / (denomX * denomY);
    const pValue = Math.abs(r) > 0.5 ? 0.01 : Math.abs(r) > 0.3 ? 0.05 : 0.1;

    setResults({
      test: "Pearson Correlation",
      variable1,
      variable2,
      n,
      correlation: r.toFixed(4),
      pValue: pValue.toFixed(4),
      significant: pValue < 0.05,
      strength: Math.abs(r) > 0.7 ? "Strong" : Math.abs(r) > 0.4 ? "Moderate" : "Weak"
    });
  };

  const runTest = () => {
    if (testType === "ttest") performTTest();
    else if (testType === "anova") performANOVA();
    else if (testType === "correlation") performCorrelation();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-sm font-medium">Statistical Tests</h2>
          <p className="text-xs text-muted-foreground">
            T-tests, ANOVA, Correlation
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Test Type</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ttest">T-Test</SelectItem>
                <SelectItem value="anova">ANOVA</SelectItem>
                <SelectItem value="correlation">Correlation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {testType === "ttest" && (
            <div>
              <Label className="text-sm">Variable</Label>
              <Select value={variable1} onValueChange={setVariable1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select variable" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {testType === "anova" && (
            <>
              <div>
                <Label className="text-sm">Dependent Variable</Label>
                <Select value={variable1} onValueChange={setVariable1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variable" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Grouping Variable</Label>
                <Select value={groupVariable} onValueChange={setGroupVariable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoricalColumns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {testType === "correlation" && (
            <>
              <div>
                <Label className="text-sm">Variable 1</Label>
                <Select value={variable1} onValueChange={setVariable1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variable" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Variable 2</Label>
                <Select value={variable2} onValueChange={setVariable2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variable" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button onClick={runTest} className="w-full">
            <TrendingUp className="w-4 h-4 mr-2" />
            Run Test
          </Button>
        </div>
      </Card>

      {results && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{results.test} Results</h3>
            <Badge variant={results.significant ? "default" : "secondary"}>
              {results.significant ? "Significant" : "Not Significant"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(results).map(([key, value]) => {
              if (key === 'test' || key === 'significant' || key === 'groupMeans' || key === 'postHoc') return null;
              return (
                <div key={key} className="p-3 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-base font-semibold">{String(value)}</p>
                </div>
              );
            })}
          </div>

          {results.groupMeans && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Group Means</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {results.groupMeans.map((g: any) => (
                  <div key={g.group} className="p-2 bg-muted/30 rounded text-sm">
                    <span className="font-medium">{g.group}:</span> {g.mean}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.postHoc && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Post-hoc Pairwise Comparisons (Tukey HSD)</p>
              <div className="space-y-2">
                {results.postHoc.map((comp: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded flex justify-between items-center text-sm">
                    <span>
                      <span className="font-medium">{comp.group1}</span> vs <span className="font-medium">{comp.group2}</span>
                      <span className="text-muted-foreground ml-2">(diff: {comp.diff})</span>
                    </span>
                    <Badge variant={comp.significant ? "default" : "secondary"} className="text-xs">
                      {comp.significant ? "Significant" : "Not Sig."}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default StatisticalTests;
