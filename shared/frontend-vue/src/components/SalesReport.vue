<script setup lang="ts">
import { ref, watch } from 'vue';
import { api, yen, type DailySales } from '../api';

const props = defineProps<{ userId: number }>();

const rows = ref<DailySales[] | null>(null);
const error = ref<string | null>(null);

watch(
  () => props.userId,
  async (userId) => {
    try {
      rows.value = await api.getDailySales(userId);
    } catch (e) {
      error.value = (e as Error).message;
    }
  },
  { immediate: true },
);
</script>

<template>
  <section>
    <h2>日別売上(直近14日・日本時間)</h2>
    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="!rows && !error" class="muted">読み込み中…</p>
    <div v-if="rows" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>日付</th>
            <th class="num">注文件数</th>
            <th class="num">売上</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.day">
            <td>{{ r.day }}</td>
            <td class="num">{{ r.orders.toLocaleString('ja-JP') }}</td>
            <td class="num">{{ yen(r.sales) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
