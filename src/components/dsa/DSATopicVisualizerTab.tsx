import SortingVisualizer from "@/components/dsa/visualizer/SortingVisualizer";
import StringBasicsVisualizer from "@/components/dsa/visualizer/string/StringBasicsVisualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DSATopicVisualizerTabProps = {
  topicId: string;
};

// Minimal mapping for v1. We can expand this incrementally.
const sortingTopicIds = new Set<string>([
  "arrays",
  "sorting",
  "searching-and-sorting",
]);

const stringTopicIds = new Set<string>(["string-basics"]);

export default function DSATopicVisualizerTab({ topicId }: DSATopicVisualizerTabProps) {
  const isSortingTopic = sortingTopicIds.has(topicId);
  const isStringTopic = stringTopicIds.has(topicId);

  if (isStringTopic) {
    return <StringBasicsVisualizer topicId={topicId} />;
  }

  if (!isSortingTopic) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visualizer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Visualizer is coming soon for this topic. Try the Sorting topic for the first version.
        </CardContent>
      </Card>
    );
  }

  return <SortingVisualizer />;
}
