import { useInventoryItem, useUpdateInventory, useDeleteInventory } from "@/hooks/use-inventory";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Trash2, Edit, DollarSign, Tag, Calendar, Box, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

export default function InventoryDetail() {
  const [match, params] = useRoute("/inventory/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: item, isLoading } = useInventoryItem(id);
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const { toast } = useToast();

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (!item) return <div>Item not found</div>;

  const handleMarkSold = () => {
    updateMutation.mutate(
      { id, status: "sold", soldDate: new Date(), soldPrice: item.targetSellPrice },
      { onSuccess: () => toast({ title: "Updated", description: "Marked as sold" }) }
    );
  };

  const handleDelete = () => {
    if (confirm("Are you sure? This cannot be undone.")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          window.location.href = "/inventory";
        }
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {item.brand} {item.model}
            <Badge variant="outline" className="text-emerald-400 border-emerald-900 bg-emerald-950/20">
              {item.referenceNumber}
            </Badge>
          </h1>
          <p className="text-slate-400 text-sm mt-1">ID: #{item.id} • Serial: {item.serialNumber || 'N/A'}</p>
        </div>
        <div className="ml-auto flex gap-3">
          {item.status !== "sold" && (
            <Button 
              variant="outline" 
              className="border-emerald-800 text-emerald-500 hover:bg-emerald-950 hover:text-emerald-400"
              onClick={handleMarkSold}
              disabled={updateMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark Sold
            </Button>
          )}
          <Button variant="destructive" size="icon" onClick={handleDelete} className="bg-red-950/50 hover:bg-red-900 text-red-400">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-lg">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Brand</span>
                <div className="text-slate-200 font-medium">{item.brand}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Model</span>
                <div className="text-slate-200 font-medium">{item.model}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Reference</span>
                <div className="text-slate-200 font-mono">{item.referenceNumber}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Year</span>
                <div className="text-slate-200">{item.year || "Unknown"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Condition</span>
                <div className="text-slate-200">{item.condition}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Includes</span>
                <div className="flex gap-2">
                  {item.box && <Badge variant="secondary" className="bg-slate-800 text-slate-300">Box</Badge>}
                  {item.papers && <Badge variant="secondary" className="bg-slate-800 text-slate-300">Papers</Badge>}
                  {!item.box && !item.papers && <span className="text-slate-600">Watch only</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-lg">Financials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Cost Basis</span>
                  <div className="text-xl font-bold text-white mt-1">${(item.purchasePrice / 100).toLocaleString()}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">List Price</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">${(item.targetSellPrice / 100).toLocaleString()}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Margin</span>
                  <div className="text-xl font-bold text-slate-300 mt-1">
                    {Math.round(((item.targetSellPrice - item.purchasePrice) / item.purchasePrice) * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Current State</span>
                <Badge className={
                  item.status === 'in_stock' ? 'bg-emerald-600' : 'bg-slate-600'
                }>
                  {item.status.replace("_", " ")}
                </Badge>
              </div>
              <Separator className="bg-slate-800" />
              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase">Acquired</span>
                <div className="text-sm text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {new Date(item.purchaseDate).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
