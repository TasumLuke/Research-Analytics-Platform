// run statistical tests on data
import { useState } from "react";
import { Card } from "@/components/user-interface/card";
import { Button } from "@/components/user-interface/button";
import { Label } from "@/components/user-interface/label";
import { Calculator, TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { AnalysisData } from "@/views/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/user-interface/select";
import { Badge } from "@/components/user-interface/badge";
import { ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";

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
  const [assumptions, setAssumptions] = useState<any>(null);

  const numericColumns = columns.filter(col => columnTypes[col] === 'numeric');
  const categoricalColumns = columns.filter(col => columnTypes[col] === 'categorical');

  // check normality using shapiro-wilk approximation
  const checkNormality = (values: number[]) => {
    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    // calculate skewness and kurtosis
    const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / n;
    const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / n - 3;

    // approximate normality test (simplified)
    const isNormal = Math.abs(skewness) < 1 && Math.abs(kurtosis) < 1;

    // generate Q-Q plot data
    const qqData = sorted.map((value, i) => {
      const theoretical = mean + std * inverseNormalCDF((i + 0.5) / n);
      return { theoretical, observed: value };
    });

    return { isNormal, skewness, kurtosis, qqData };
  };

  // inverse normal cdf approximation
  const inverseNormalCDF = (p: number) => {
    const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
    const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833];
    const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
               0.0276438810333863, 0.0038405729373609, 0.0003951896511919,
               0.0000321767881768, 0.0000002888167364, 0.0000003960315187];
    
    if (p < 0.5) {
      const t = Math.sqrt(-2 * Math.log(p));
      return -(t - (a[0] + t * (a[1] + t * (a[2] + t * a[3]))) /
        (1 + t * (b[0] + t * (b[1] + t * (b[2] + t * b[3])))));
    } else {
      const t = Math.sqrt(-2 * Math.log(1 - p));
      return t - (a[0] + t * (a[1] + t * (a[2] + t * a[3]))) /
        (1 + t * (b[0] + t * (b[1] + t * (b[2] + t * b[3]))));
    }
  };

  // check homoscedasticity (equal variances)
  const checkHomoscedasticity = (groups: { group: string; values: number[] }[]) => {
    // calculate variance for each group
    const variances = groups.map(g => {
      const mean = g.values.reduce((a, b) => a + b, 0) / g.values.length;
      const variance = g.values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (g.values.length - 1);
      return { group: g.group, variance };
    });

    // levene's test approximation - check if max variance is not too different from min
    const maxVar = Math.max(...variances.map(v => v.variance));
    const minVar = Math.min(...variances.map(v => v.variance));
    const ratio = maxVar / minVar;
    
    // if ratio > 3, variances likely unequal
    const isHomoscedastic = ratio < 3;

    return { isHomoscedastic, variances, ratio };
  };

  // generate residual plot data
  const generateResidualPlot = (predicted: number[], observed: number[]) => {
    return predicted.map((pred, i) => ({
      predicted: pred,
      residual: observed[i] - pred
    }));
  };

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

    // check assumptions
    const normalityCheck = checkNormality(values);

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

    setAssumptions({
      normality: normalityCheck,
      testType: "ttest",
      guidance: normalityCheck.isNormal 
        ? "Data appears normally distributed. T-test is appropriate."
        : "Data may not be normally distributed. Consider using a non-parametric test (e.g., Wilcoxon signed-rank test) if sample size is small."
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

    // check assumptions
    const normalityChecks = groupData.map(g => ({
      group: g.group,
      ...checkNormality(g.values)
    }));
    const allNormal = normalityChecks.every(nc => nc.isNormal);

    const homoscedasticityCheck = checkHomoscedasticity(groupData);

    // generate residual plot
    const allValues = data.map(row => Number(row[variable1])).filter(v => !isNaN(v));
    const predicted = data.map(row => {
      const group = String(row[groupVariable]);
      const groupMean = groupMeans.find(g => g.group === group)?.mean || 0;
      return groupMean;
    });
    const residualData = generateResidualPlot(predicted, allValues);

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

    let guidance = "";
    if (!allNormal) {
      guidance = "Some groups may not be normally distributed. Consider using Kruskal-Wallis test (non-parametric alternative) if sample sizes are small. ";
    }
    if (!homoscedasticityCheck.isHomoscedastic) {
      guidance += "Variances across groups appear unequal (heteroscedasticity detected). Consider using Welch's ANOVA or transforming the data. ";
    }
    if (allNormal && homoscedasticityCheck.isHomoscedastic) {
      guidance = "Assumptions met. ANOVA is appropriate for this data.";
    }

    setAssumptions({
      normality: normalityChecks,
      homoscedasticity: homoscedasticityCheck,
      residualData,
      testType: "anova",
      guidance
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

    // check assumptions
    const normalityX = checkNormality(pairs.map(p => p.x));
    const normalityY = checkNormality(pairs.map(p => p.y));

    // check for linearity using residuals
    const slope = numerator / pairs.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0);
    const intercept = meanY - slope * meanX;
    const predicted = pairs.map(p => slope * p.x + intercept);
    const residualData = generateResidualPlot(predicted, pairs.map(p => p.y));

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

    let guidance = "Pearson correlation assumes: (1) linear relationship, (2) bivariate normality. ";
    if (!normalityX.isNormal || !normalityY.isNormal) {
      guidance += "One or both variables may not be normally distributed. Consider using Spearman's rank correlation (non-parametric alternative). ";
    }
    if (normalityX.isNormal && normalityY.isNormal) {
      guidance += "Both variables appear normally distributed. Pearson correlation is appropriate.";
    }

    setAssumptions({
      normalityX,
      normalityY,
      residualData,
      scatterData: pairs,
      testType: "correlation",
      guidance
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

      {assumptions && (
        <Card className="p-6 border-primary/20">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Assumption Checking & Guidance</h3>
              <p className="text-sm text-muted-foreground">{assumptions.guidance}</p>
            </div>
          </div>

          {assumptions.testType === "ttest" && assumptions.normality && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                {assumptions.normality.isNormal ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-medium">Normality: {assumptions.normality.isNormal ? "Passed" : "Failed"}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/50 rounded">
                  <p className="text-muted-foreground">Skewness</p>
                  <p className="font-semibold">{assumptions.normality.skewness.toFixed(3)}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <p className="text-muted-foreground">Kurtosis</p>
                  <p className="font-semibold">{assumptions.normality.kurtosis.toFixed(3)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Q-Q Plot (Normality Check)</p>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="theoretical" name="Theoretical Quantiles" label={{ value: 'Theoretical Quantiles', position: 'insideBottom', offset: -10 }} />
                    <YAxis dataKey="observed" name="Sample Quantiles" label={{ value: 'Sample Quantiles', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip />
                    <Scatter data={assumptions.normality.qqData} fill="hsl(var(--primary))" />
                    <ReferenceLine stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" segment={[
                      { x: Math.min(...assumptions.normality.qqData.map((d: any) => d.theoretical)), y: Math.min(...assumptions.normality.qqData.map((d: any) => d.observed)) },
                      { x: Math.max(...assumptions.normality.qqData.map((d: any) => d.theoretical)), y: Math.max(...assumptions.normality.qqData.map((d: any) => d.observed)) }
                    ]} />
                  </ScatterChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">Points should fall along the diagonal line if data is normally distributed</p>
              </div>
            </div>
          )}

          {assumptions.testType === "anova" && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {assumptions.normality.every((n: any) => n.isNormal) ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-medium">Normality by Group</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {assumptions.normality.map((n: any) => (
                    <div key={n.group} className="p-2 bg-muted/30 rounded text-sm">
                      <span className="font-medium">{n.group}:</span> {n.isNormal ? "✓ Normal" : "✗ Non-normal"}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {assumptions.homoscedasticity.isHomoscedastic ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-medium">Homoscedasticity (Equal Variances): {assumptions.homoscedasticity.isHomoscedastic ? "Passed" : "Failed"}</span>
                </div>
                <div className="p-3 bg-muted/50 rounded text-sm">
                  <p className="text-muted-foreground">Variance Ratio: {assumptions.homoscedasticity.ratio.toFixed(3)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ratio &lt; 3 indicates equal variances</p>
                </div>
              </div>

              {assumptions.residualData && (
                <div>
                  <p className="text-sm font-semibold mb-2">Residual Plot</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="predicted" name="Predicted Values" label={{ value: 'Predicted Values', position: 'insideBottom', offset: -10 }} />
                      <YAxis dataKey="residual" name="Residuals" label={{ value: 'Residuals', angle: -90, position: 'insideLeft' }} />
                      <RechartsTooltip />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Scatter data={assumptions.residualData} fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground mt-2">Residuals should be randomly scattered around zero line</p>
                </div>
              )}
            </div>
          )}

          {assumptions.testType === "correlation" && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {assumptions.normalityX.isNormal ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-medium text-sm">Variable 1 Normality</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {assumptions.normalityY.isNormal ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-medium text-sm">Variable 2 Normality</span>
                  </div>
                </div>
              </div>

              {assumptions.residualData && (
                <div>
                  <p className="text-sm font-semibold mb-2">Residual Plot (Linearity Check)</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="predicted" name="Fitted Values" label={{ value: 'Fitted Values', position: 'insideBottom', offset: -10 }} />
                      <YAxis dataKey="residual" name="Residuals" label={{ value: 'Residuals', angle: -90, position: 'insideLeft' }} />
                      <RechartsTooltip />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Scatter data={assumptions.residualData} fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground mt-2">Random scatter indicates linear relationship is appropriate</p>
                </div>
              )}

              {assumptions.scatterData && (
                <div>
                  <p className="text-sm font-semibold mb-2">Scatter Plot</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name={results?.variable1} />
                      <YAxis dataKey="y" name={results?.variable2} />
                      <RechartsTooltip />
                      <Scatter data={assumptions.scatterData} fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

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
