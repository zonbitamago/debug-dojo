<script setup lang="ts">
import { ref } from 'vue';
import ShopPage from './components/ShopPage.vue';
import OrderHistory from './components/OrderHistory.vue';
import OrderSearch from './components/OrderSearch.vue';
import SalesReport from './components/SalesReport.vue';

const users = [
  { id: 1, name: '田中 一郎' },
  { id: 2, name: '佐藤 花子' },
];

const tabs = [
  { key: 'shop', label: '商品・注文' },
  { key: 'history', label: '注文履歴' },
  { key: 'search', label: '注文検索(CS用)' },
  { key: 'report', label: '日別売上' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const userId = ref(1);
const tab = ref<TabKey>('shop');
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>練習用ECショップ</h1>
      <label class="user-switcher">
        ログイン中のユーザー
        <select v-model.number="userId">
          <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
      </label>
    </header>

    <nav class="tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        :class="tab === t.key ? 'tab active' : 'tab'"
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </nav>

    <main>
      <ShopPage v-if="tab === 'shop'" :user-id="userId" />
      <OrderHistory v-else-if="tab === 'history'" :user-id="userId" />
      <OrderSearch v-else-if="tab === 'search'" :user-id="userId" />
      <SalesReport v-else :user-id="userId" />
    </main>
  </div>
</template>
