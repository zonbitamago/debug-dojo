<script setup lang="ts">
import { ref, watch } from 'vue';
import { api, yen, type Product } from '../api';
import OrderForm from './OrderForm.vue';

const props = defineProps<{ userId: number }>();

const products = ref<Product[]>([]);
const error = ref<string | null>(null);
const refreshKey = ref(0);

async function loadProducts() {
  try {
    products.value = await api.getProducts(props.userId);
  } catch (e) {
    error.value = (e as Error).message;
  }
}

watch([() => props.userId, refreshKey], loadProducts, { immediate: true });
</script>

<template>
  <section>
    <h2>商品一覧</h2>
    <p v-if="error" class="message error">{{ error }}</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>商品名</th>
            <th class="num">価格</th>
            <th class="num">在庫</th>
            <th>注文</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>{{ p.name }}</td>
            <td class="num">{{ yen(p.price) }}</td>
            <td class="num">{{ p.stock }}</td>
            <td>
              <OrderForm :user-id="userId" :product="p" @ordered="refreshKey++" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
