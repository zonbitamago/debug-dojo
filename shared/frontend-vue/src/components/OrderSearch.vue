<script setup lang="ts">
import { ref } from 'vue';
import { api, jst, yen, type Order } from '../api';

const props = defineProps<{ userId: number }>();

const number = ref('');
const order = ref<Order | null>(null);
const error = ref<string | null>(null);
const searching = ref(false);

async function handleSearch() {
  searching.value = true;
  order.value = null;
  error.value = null;
  try {
    order.value = await api.searchOrder(props.userId, number.value);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    searching.value = false;
  }
}
</script>

<template>
  <section>
    <h2>注文検索(問い合わせ対応用)</h2>
    <form class="search-form" @submit.prevent="handleSearch">
      <input v-model="number" placeholder="注文番号(例: ORD-10000123)" />
      <button class="primary" type="submit" :disabled="searching || !number">
        {{ searching ? '検索中…' : '検索' }}
      </button>
    </form>
    <p v-if="error" class="message error">{{ error }}</p>
    <dl v-if="order" class="detail">
      <dt>注文番号</dt><dd>{{ order.orderNumber }}</dd>
      <dt>注文者</dt><dd>{{ order.userName }}</dd>
      <dt>注文日時</dt><dd>{{ jst(order.createdAt) }}</dd>
      <dt>商品</dt><dd>{{ order.productName }} × {{ order.quantity }}</dd>
      <dt>金額</dt><dd>{{ yen(order.amount) }}</dd>
      <dt>状態</dt><dd>{{ order.status }}</dd>
    </dl>
  </section>
</template>
