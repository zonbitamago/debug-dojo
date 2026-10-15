<script setup lang="ts">
import { ref, watch } from 'vue';
import { api, jst, yen, type Order } from '../api';

const props = defineProps<{ userId: number }>();

const orders = ref<Order[] | null>(null);
const error = ref<string | null>(null);

watch(
  () => props.userId,
  async (userId) => {
    orders.value = null;
    error.value = null;
    try {
      orders.value = await api.getOrders(userId);
    } catch (e) {
      error.value = (e as Error).message;
    }
  },
  { immediate: true },
);
</script>

<template>
  <section>
    <h2>注文履歴</h2>
    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="!orders && !error" class="muted">読み込み中…</p>
    <template v-if="orders">
      <p class="muted">{{ orders.length }}件</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>注文番号</th>
              <th>注文日時</th>
              <th>商品</th>
              <th class="num">数量</th>
              <th class="num">金額</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id">
              <td>{{ o.orderNumber }}</td>
              <td>{{ jst(o.createdAt) }}</td>
              <td>{{ o.productName }}</td>
              <td class="num">{{ o.quantity }}</td>
              <td class="num">{{ yen(o.amount) }}</td>
              <td>{{ o.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
