// Purpose: keeps track of different model versions
import { Card } from "@/components/user-interface/card";
import { Button } from "@/components/user-interface/button";
import { Badge } from "@/components/user-interface/badge";
import { ModelVersion } from "@/views/types";

interface ModelVersionsProps {
  versions: ModelVersion[];
  onLoadVersion: (version: ModelVersion) => void;
  currentVersion: string;
}
/**
 * Displays list of model versions and allows user to load model version
 * @param {ModelVersion[]} versions Array of model versions
 * @param {(version: ModelVersion) => void} onLoadVersion Successful version loading
 * @param {string} currentVersion String version of current active model
 */
const ModelVersions = ({ versions, onLoadVersion, currentVersion }: ModelVersionsProps) => {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium">Version History</h3>
          <p className="text-xs text-muted-foreground">
            Manage model versions
          </p>
        </div>

        {versions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No versions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <Card key={version.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium">
                        {version.version}
                      </p>
                      {version.version === currentVersion && (
                        <Badge variant="outline" className="text-xs h-5">
                          Active
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Size</p>
                        <p className="font-medium">{version.datasetSize}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Accuracy</p>
                        <p className="font-medium">
                          {version.metrics.accuracy.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">F1</p>
                        <p className="font-medium">
                          {version.metrics.f1Score.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadVersion(version)}
                    disabled={version.version === currentVersion}
                    className="ml-3 h-7 text-xs"
                  >
                    Load
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ModelVersions;
