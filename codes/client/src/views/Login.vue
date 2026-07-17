<template>
    <v-container fluid class="pa-0 position-relative" style="height: 100vh">
        <div id="content">
            <v-sheet width="70vw" max-width="768" v-if="isLogin">
                <h3 class="text-headline-small font-weight-bold">Login</h3>
                <v-divider :thickness="8" class="border-opacity-50 mb-4" color="info" length="40%"></v-divider>
                <v-form @submit.prevent="login">
                    <v-text-field v-model="userName" label="User Name" variant="outlined"></v-text-field>

                    <v-text-field v-model="password" variant="outlined" label="Password" :type="ifPasswordLogin ? 'password' : 'text'" >
                        <template #append-inner>
                            <v-icon color="#64B5F6" @click="ifPasswordLogin = !ifPasswordLogin;">{{ ifPasswordLogin ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                        </template>
                    </v-text-field>

                    <div class="buttons">
                        <v-btn class="mt-2" type="submit">Login</v-btn>
                        <v-btn class="mt-2" type="button" variant="outlined" @click="toggleSheet(false)">I don't have an account</v-btn>
                    </div>
                </v-form>
            </v-sheet>
            <v-sheet width="70vw" max-width="768" v-else>
                <h3 class="text-headline-small font-weight-bold mt-0 mb-4">Register</h3>
                <v-divider :thickness="8" class="border-opacity-50 mb-4" color="info" length="40%"></v-divider>
                <v-form @submit.prevent="register">
                    <v-text-field v-model="userName" label="User Name" variant="outlined"></v-text-field>

                    <v-text-field v-model="password" variant="outlined" label="Password" :type="ifPasswordRegister ? 'password' : 'text'" >
                        <template #append-inner>
                            <v-icon color="#64B5F6" @click="ifPasswordRegister = !ifPasswordRegister;">{{ ifPasswordRegister ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                        </template>
                    </v-text-field>

                    <v-text-field v-model="confirmPassword" variant="outlined" label="Confirm Password" :type="ifPasswordConfirm ? 'password' : 'text'" >
                        <template #append-inner>
                            <v-icon color="#64B5F6" @click="ifPasswordConfirm = !ifPasswordConfirm;">{{ ifPasswordConfirm ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                        </template>
                    </v-text-field>

                    <div class="buttons">
                        <v-btn class="mt-2" type="submit">Register</v-btn>
                        <v-btn class="mt-2" type="button" variant="outlined" @click="toggleSheet(true)">Back to Login</v-btn>
                    </div>
                </v-form>
            </v-sheet>
            <p id="message">{{ message }}</p>
        </div>
    </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';

const userName = ref('');
const password = ref('');
const confirmPassword = ref('');
const ifPasswordLogin = ref(true);
const ifPasswordRegister = ref(true);
const ifPasswordConfirm = ref(true);
const message = ref('');
const isLogin = ref(true);

const authStore = useAuthStore();

function toggleSheet(toLogin){
    isLogin.value = toLogin;
    message.value = '';
    userName.value = '';
    password.value = '';
    confirmPassword.value = '';
}

async function login(){
    if (!userName.value || !password.value) {
        message.value = 'Please enter both username and password.';
        return;
    }
    
    message.value = '';
    const success = await authStore.login(userName.value, password.value);
    if (!success){
        message.value = 'Login failed. Please check your username and password.';
    }
    userName.value = '';
    password.value = '';
}

async function register(){
    if (!userName.value || !password.value || !confirmPassword.value) {
        message.value = 'Please fill in all fields.';
        return;
    }

    message.value = '';

    if (password.value !== confirmPassword.value) {
        message.value = 'Passwords do not match.';
        return;
    }

    const success = await authStore.register(userName.value, password.value);
    if (!success){
        message.value = 'Registration failed. Please try again.';
    }
    userName.value = '';
    password.value = '';
    confirmPassword.value = '';
}
</script>

<style lang="scss" scoped>
#content {
    position: absolute;
    top: 25%;
    left: 50%;
    transform: translateX(-50%);

    display: flex;
    flex-direction: column;
}

#message {
    color: red;
    margin-top: 10px;
    font-size: 14px;
}

.buttons {
    display: flex;
    justify-content: space-around;

    &:deep(.v-btn) {
        width: 45%;
    }
}

@media (max-width: 1000px) {
    .buttons {
        flex-direction: column;
        gap: 12px;
    }

    .buttons :deep(.v-btn) {
        width: 100%;
    }
}
</style>