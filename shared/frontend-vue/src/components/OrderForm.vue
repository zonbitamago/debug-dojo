<script setup lang="ts">
import { ref } from 'vue';
import { api, yen, type Product } from '../api';

const props = defineProps<{ userId: number; product: Product }>();
const emit = defineEmits<{ ordered: [] }>();

const quantity = ref(1);
const submitting = ref(false);
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null);

async function handleOrder() {
  if (submitting.value) return;
  submitting.value = true;
  message.value = null;
  try {
    const order = await api.createOrder(props.userId, props.product.id, quantity.value);
    message.value = { type: 'success', text: `注文が完了しました(${order.orderNumber} / ${yen(order.amount)})` };
    emit('ordered');
  } catch (e) {
    message.value = { type: 'error', text: (e as Error).message };
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="order-form">
    <select v-model.number="quantity">
      <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}個</option>
    </select>
    <button class="primary" :disabled="submitting" @click="handleOrder">
      {{ submitting ? '処理中…' : '注文を確定する' }}
    </button>
    <p v-if="message" :class="`message ${message.type}`">{{ message.text }}</p>
  </div>
</template>
