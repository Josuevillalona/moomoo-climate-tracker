'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  DollarSign, 
  Brain, 
  MapPin, 
  Building, 
  Target,
  Mail,
  Bell,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';
import { AlexDealFilters } from '../../../types/climate-schema';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  filters: AlexDealFilters;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  triggerCount: number;
  lastTriggered?: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  slackEnabled?: boolean;
}

interface AlertConfigDialogProps {
  rule?: AlertRule | null;
  onSave: (rule: AlertRule) => void;
  onClose: () => void;
}

const FUNDING_STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Growth', 'IPO'];
const CLIMATE_SECTORS = [
  'Solar Energy',
  'Wind Energy',
  'Energy Storage',
  'Electric Vehicles',
  'Carbon Capture',
  'Industrial Automation',
  'Supply Chain',
  'Agriculture Tech',
  'Water Management',
  'Waste Management',
  'Green Building',
  'Climate Analytics'
];
const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands',
  'Sweden',
  'Denmark',
  'Israel',
  'Singapore',
  'Australia',
  'India',
  'Brazil'
];

export const AlertConfigDialog: React.FC<AlertConfigDialogProps> = ({ rule, onSave, onClose }) => {
  const [formData, setFormData] = useState<AlertRule>(() => ({
    id: rule?.id || '',
    name: rule?.name || '',
    description: rule?.description || '',
    filters: rule?.filters || {
      investment_score_min: 60,
      funding_stages: ['Seed'],
      has_ai_focus: undefined,
      climate_sectors: [],
      countries: ['United States'],
      funding_range: { min: 500000, max: 15000000 },
      confidence_score_min: 0.6,
      alex_review_status: ['pending']
    },
    isActive: rule?.isActive ?? true,
    priority: rule?.priority || 'medium',
    triggerCount: rule?.triggerCount || 0,
    lastTriggered: rule?.lastTriggered,
    emailEnabled: rule?.emailEnabled ?? true,
    pushEnabled: rule?.pushEnabled ?? true,
    slackEnabled: rule?.slackEnabled ?? false,
  }));

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a rule name');
      return;
    }
    
    onSave(formData);
  };

  const updateFilters = (key: keyof AlexDealFilters, value: any) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value
      }
    }));
  };

  const addToArrayFilter = (key: keyof AlexDealFilters, value: string) => {
    const currentArray = (formData.filters[key] as string[]) || [];
    if (!currentArray.includes(value)) {
      updateFilters(key, [...currentArray, value]);
    }
  };

  const removeFromArrayFilter = (key: keyof AlexDealFilters, value: string) => {
    const currentArray = (formData.filters[key] as string[]) || [];
    updateFilters(key, currentArray.filter(item => item !== value));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Target className="w-6 h-6 mr-2" />
            {rule ? 'Edit Alert Rule' : 'Create New Alert Rule'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., AI Seed Deals"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this alert tracks"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <Label>Email Notifications</Label>
                </div>
                <Switch
                  checked={formData.emailEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <Label>Push Notifications</Label>
                </div>
                <Switch
                  checked={formData.pushEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pushEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <Label>Slack Notifications</Label>
                </div>
                <Switch
                  checked={formData.slackEnabled || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, slackEnabled: checked }))}
                />
              </div>

              {formData.emailEnabled && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    📧 Emails will be sent to <strong>alex@climatevcp.com</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Deal Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deal Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Investment Score */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4" />
                <span>Minimum Investment Score</span>
              </Label>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.filters.investment_score_min || 0}
                  onChange={(e) => updateFilters('investment_score_min', parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">
                  (0-100, Alex's proprietary scoring system)
                </span>
              </div>
            </div>

            {/* Funding Stages */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Building className="w-4 h-4" />
                <span>Funding Stages</span>
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.filters.funding_stages || []).map(stage => (
                  <Badge key={stage} variant="secondary" className="flex items-center space-x-1">
                    <span>{stage}</span>
                    <button
                      onClick={() => removeFromArrayFilter('funding_stages', stage)}
                      className="ml-1 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={(value) => addToArrayFilter('funding_stages', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add funding stage" />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_STAGES.filter(stage => 
                    !(formData.filters.funding_stages || []).includes(stage)
                  ).map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Focus */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4" />
                <span>AI Focus Requirement</span>
              </Label>
              <Select
                value={formData.filters.has_ai_focus === undefined ? 'any' : formData.filters.has_ai_focus.toString()}
                onValueChange={(value) => 
                  updateFilters('has_ai_focus', value === 'any' ? undefined : value === 'true')
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any (AI or non-AI)</SelectItem>
                  <SelectItem value="true">Must have AI focus</SelectItem>
                  <SelectItem value="false">Non-AI companies only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Funding Range */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4" />
                <span>Funding Amount Range</span>
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Minimum ($)</Label>
                  <Input
                    type="number"
                    value={formData.filters.funding_range?.min || 0}
                    onChange={(e) => updateFilters('funding_range', {
                      ...formData.filters.funding_range,
                      min: parseInt(e.target.value) || 0
                    })}
                    placeholder="500000"
                  />
                </div>
                <div>
                  <Label className="text-sm">Maximum ($)</Label>
                  <Input
                    type="number"
                    value={formData.filters.funding_range?.max || 0}
                    onChange={(e) => updateFilters('funding_range', {
                      ...formData.filters.funding_range,
                      max: parseInt(e.target.value) || 0
                    })}
                    placeholder="15000000"
                  />
                </div>
              </div>
            </div>

            {/* Climate Sectors */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Building className="w-4 h-4" />
                <span>Climate Sectors</span>
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.filters.climate_sectors || []).map(sector => (
                  <Badge key={sector} variant="secondary" className="flex items-center space-x-1">
                    <span>{sector}</span>
                    <button
                      onClick={() => removeFromArrayFilter('climate_sectors', sector)}
                      className="ml-1 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={(value) => addToArrayFilter('climate_sectors', value)}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Add climate sector" />
                </SelectTrigger>
                <SelectContent>
                  {CLIMATE_SECTORS.filter(sector => 
                    !(formData.filters.climate_sectors || []).includes(sector)
                  ).map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Countries */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4" />
                <span>Target Countries</span>
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.filters.countries || []).map(country => (
                  <Badge key={country} variant="secondary" className="flex items-center space-x-1">
                    <span>{country}</span>
                    <button
                      onClick={() => removeFromArrayFilter('countries', country)}
                      className="ml-1 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={(value) => addToArrayFilter('countries', value)}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Add country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.filter(country => 
                    !(formData.filters.countries || []).includes(country)
                  ).map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
