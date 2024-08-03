function logTag(tag) {
  const event = new CustomEvent(`cy:gtm.tag.fired`, {detail: tag});
  document.dispatchEvent(event);
}

document.addEventListener('alpine:init', () => {
  Alpine.store('log', {
    tags: [],
    updatedTags: new Set(),
    addTag(tag) {
      tag.totalFired = 1;
      tag.triggerEvent = [tag.triggerEvent];
      this.tags.push(tag);
      this.updatedTags.add(tag.key);
    },
    findTag(key) {
      return this.tags.find(tag => tag.key === key);
    },
    addOrUpdateTag(tag) {
      const existingTag = this.findTag(tag.key);
      if (existingTag) {
        existingTag.totalFired++;
        existingTag.triggerEvent.push(tag.triggerEvent);
        this.updatedTags.add(existingTag.key);
      } else {
        this.addTag(tag);
      }
    },
    clearUpdatedTags() {
      this.updatedTags.clear();
    }
  });  

  document.addEventListener('cy:gtm.tag.fired', (event) => {

    if (! event.detail.key)
      return;

    Alpine.store('log').addOrUpdateTag(event.detail);

  });

});