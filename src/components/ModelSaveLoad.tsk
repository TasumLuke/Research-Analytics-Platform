import { Download, Upload } from "lucide-react";
import { Button } from "@/components/user-interface/button";
import { Card } from "@/components/user-interface/card";
import { toast } from "sonner";
import { RandomForestClassifier as RFClassifier } from "ml-random-forest";

interface ModelSaveLoadProps {
  model: any;
  metrics: any;
  featureImportance: any[];
  featureConfig: any;
  onModelLoaded: (model: any, metrics: any, importance: any[], config: any) => void;
}

const ModelSaveLoad = ({ 
  model, 
  metrics, 
  featureImportance, 
  featureConfig,
  onModelLoaded 
}: ModelSaveLoadProps) => {

  const saveModel = () => {
    if (!model || !metrics) {
      toast.error("Nothing to save yet - train a model first");
      return;
    }

    try {
      // grab all the important bits
      const modelData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        classifier: {
          options: model.options,
          trees: model.estimators.map((tree: any) => ({
            root: tree.root,
            gain: tree.gain,
          })),
        },
        metrics,
        featureImportance,
        featureConfig,
      };

      // turn it into a file
      const blob = new Blob([JSON.stringify(modelData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `model-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Model saved to your downloads folder");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Couldn't save the model");
    }
  };

  const loadModel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const modelData = JSON.parse(e.target?.result as string);

        // rebuild the random forest from the saved data
        const options = modelData.classifier.options;
        const classifier = new RFClassifier(options);

        // put the trees back together
        classifier.estimators = modelData.classifier.trees.map((treeData: any) => ({
          root: treeData.root,
          gain: treeData.gain,
          predict: function(sample: number[]) {
            return predictTree(this.root, sample);
          }
        }));

        // keep the encoding info we need for predictions
        (classifier as any).options = options;

        onModelLoaded(
          classifier,
          modelData.metrics,
          modelData.featureImportance,
          modelData.featureConfig
        );

        toast.success("Model loaded and ready to use");
      } catch (error) {
        console.error("Load error:", error);
        toast.error("Couldn't load that file - might be corrupted");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  // helper to traverse a decision tree
  const predictTree = (node: any, sample: number[]): number => {
    if (node.category !== undefined) {
      return node.category;
    }
    if (sample[node.column] < node.value) {
      return predictTree(node.left, sample);
    } else {
      return predictTree(node.right, sample);
    }
  };

  return (
    <div className="flex gap-2">
      {model && (
        <Button
          onClick={saveModel}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Download className="w-3 h-3 mr-2" />
          Save Model
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        className="flex-1 relative"
        asChild
      >
        <label>
          <Upload className="w-3 h-3 mr-2" />
          Load Model
          <input
            type="file"
            accept=".json"
            onChange={loadModel}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </Button>
    </div>
  );
};

export default ModelSaveLoad;
