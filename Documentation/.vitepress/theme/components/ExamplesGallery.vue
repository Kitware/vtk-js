<template>
  <div class="examples-page">
    <h2>Examples Gallery</h2>
    <div class="examples-controls">
      <input v-model="search" placeholder="Search examples..." />
      <div class="category-buttons">
        <button :class="{ selected: !selectedCategory }" @click="selectedCategory = ''">All Categories</button>
        <button v-for="cat in categories" :key="cat" :class="{ selected: selectedCategory === cat }"
          @click="selectedCategory = cat">{{ cat }}</button>
      </div>
    </div>
    <div class="examples-list">
      <div v-for="ex in filteredExamples" :key="ex.title" class="example-card">
        <a :href="ex.link">
          <img :src="ex.image" :alt="ex.title" />
          <h3>{{ ex.title }}</h3>
          <p class="category">{{ ex.category }}</p>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import examples from '../../../examples/gallery.js'

const search = ref('')
const selectedCategory = ref('')

const categories = computed(() =>
  Array.from(new Set(examples.map(e => e.category))).sort()
)

const filteredExamples = computed(() => {
  return examples.filter(ex => {
    const matchesSearch = ex.title.toLowerCase().includes(search.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || ex.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})
</script>

<style scoped>
.examples-page {
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  padding-top: calc(var(--spacing) * 24);
  padding-bottom: calc(var(--spacing) * 12);
  gap: calc(var(--spacing) * 8);
  max-width: calc(var(--vp-layout-max-width) - 64px);
  flex-direction: column;
  align-items: center;
}

.examples-page h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.examples-controls input {
  padding: 0.3em 1.2em;
  border: 1px solid var(--vp-c-divider);
  border-radius: calc(var(--radius));
  font-size: 1em;
  width: 400px;
}

.examples-controls input::placeholder {
  color: #aaa;
}

.examples-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  justify-content: center;
  align-items: center;
}

.category-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-buttons button {
  padding: 0.2em 1em;
  border: 1px solid var(--vp-c-divider);
  border-radius: calc(var(--radius));
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.category-buttons button:hover {
  background: #171717b3;
  color: #fff;
}

.category-buttons button.selected {
  color: #fff;
  border-color: #0078d4;
}

.examples-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.example-card {
  width: 250px;
  overflow: hidden;
  transition: box-shadow 0.2s;
  border: 1px solid var(--vp-c-divider);
  border-radius: calc(var(--radius) * 2);
}

.example-card:hover {
  border-color: var(--vp-c-brand-1);
}

.example-card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
}

.example-card h3 {
  margin: 0.5rem;
  font-size: 1.1rem;
}

.example-card .category {
  margin: 0.5rem;
  font-size: 0.9rem;
}
</style>
