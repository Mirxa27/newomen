</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                value={formData.system_prompt || ''}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                rows={3}
                className="glass"
              />
            </div>
          </div>
        );
      }
}