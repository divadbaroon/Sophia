import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

export interface EvaluationCriterion {
  id: string;
  name: string;
  conversationGoalPrompt: string;
}

interface EvaluationCriteriaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  criteria: EvaluationCriterion[];
  onSave: (criteria: EvaluationCriterion[]) => void;
}

export function EvaluationCriteriaModal({
  isOpen,
  onOpenChange,
  criteria,
  onSave
}: EvaluationCriteriaModalProps) {
  const [localCriteria, setLocalCriteria] = useState<EvaluationCriterion[]>(criteria);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCriterion, setNewCriterion] = useState<Omit<EvaluationCriterion, 'id'>>({
    name: "",
    conversationGoalPrompt: ""
  });

  const handleSave = () => {
    onSave(localCriteria);
    onOpenChange(false);
  };

  const handleAddNew = () => {
    if (newCriterion.name.trim() && newCriterion.conversationGoalPrompt.trim()) {
      const newId = `criterion_${Date.now()}`;
      setLocalCriteria([...localCriteria, { ...newCriterion, id: newId }]);
      setNewCriterion({ name: "", conversationGoalPrompt: "" });
      setIsAddingNew(false);
    }
  };

  const handleEdit = (id: string, field: keyof EvaluationCriterion, value: string | boolean) => {
    setLocalCriteria(prev => prev.map(criterion => 
      criterion.id === id ? { ...criterion, [field]: value } : criterion
    ));
  };

  const handleDelete = (id: string) => {
    setLocalCriteria(prev => prev.filter(criterion => criterion.id !== id));
  };

  const handleCancel = () => {
    setLocalCriteria(criteria); // Reset to original criteria
    setEditingId(null);
    setIsAddingNew(false);
    setNewCriterion({ name: "", conversationGoalPrompt: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Evaluation Criteria Management</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          {/* Existing Criteria */}
          {localCriteria.map((criterion) => (
            <div key={criterion.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {editingId === criterion.id ? (
                    <Input
                      value={criterion.name}
                      onChange={(e) => handleEdit(criterion.id, 'name', e.target.value)}
                      className="font-medium mb-2"
                      placeholder="Criterion name"
                    />
                  ) : (
                    <h4 className="font-medium text-gray-900 mb-1">{criterion.name}</h4>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingId === criterion.id ? (
                    <>
                      <Button
                        onClick={() => setEditingId(null)}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => setEditingId(criterion.id)}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(criterion.id)}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Description
                  </label>
                  {editingId === criterion.id ? (
                    <Textarea
                      value={criterion.conversationGoalPrompt}
                      onChange={(e) => handleEdit(criterion.id, 'conversationGoalPrompt', e.target.value)}
                      placeholder="Describe what this criterion evaluates..."
                      className="text-sm"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                      {criterion.conversationGoalPrompt}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Button for adding new criteria*/}
          {!isAddingNew && (
            <div className="flex justify-center">
              <Button
                onClick={() => setIsAddingNew(true)}
                variant="outline"
                size="sm"
                className="w-12 h-12 rounded-full p-0 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                <Plus className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
          )}

          {/* Add New Criterion Form */}
          {isAddingNew && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">New Evaluation Criterion</h4>
                <Button
                  onClick={() => setIsAddingNew(false)}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Title
                  </label>
                  <Input
                    value={newCriterion.name}
                    onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
                    placeholder="e.g., Teaching Effectiveness"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Description
                  </label>
                  <Textarea
                    value={newCriterion.conversationGoalPrompt}
                    onChange={(e) => setNewCriterion({ ...newCriterion, conversationGoalPrompt: e.target.value })}
                    placeholder="Describe what this criterion should evaluate..."
                    className="text-sm"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleAddNew}
                  disabled={!newCriterion.name.trim() || !newCriterion.conversationGoalPrompt.trim()}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Criterion
                </Button>
              </div>
            </div>
          )}

          {localCriteria.length === 0 && !isAddingNew && (
            <div className="text-center py-8 text-gray-500">
              <p>No evaluation criteria defined yet.</p>
              <p className="text-sm">Click &quot;Add Criterion&quot; to create your first one.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {localCriteria.length} criteria defined
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}