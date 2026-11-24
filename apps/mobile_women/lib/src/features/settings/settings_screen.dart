import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_dart/shared_dart.dart';
import '../../core/api_client.dart';
import '../auth/auth_controller.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  List<dynamic> _contacts = [];
  bool _isLoadingContacts = true;

  @override
  void initState() {
    super.initState();
    _loadContacts();
  }

  Future<void> _loadContacts() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.getEmergencyContacts();
      if (res.data is List) {
        setState(() {
          _contacts = res.data as List;
          _isLoadingContacts = false;
        });
      }
    } catch (_) {
      setState(() => _isLoadingContacts = false);
    }
  }

  void _showAddContactDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final relCtrl = TextEditingController(text: 'Family');
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Text('Add Emergency Contact', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Contact Name',
                  hintText: 'e.g. Papa, Mom, Priya',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Mobile Number',
                  hintText: '+919876543210',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: relCtrl,
                decoration: const InputDecoration(
                  labelText: 'Relationship',
                  hintText: 'e.g. Father, Mother, Spouse',
                  prefixIcon: Icon(Icons.people_outline),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: isSaving ? null : () => Navigator.of(ctx).pop(),
              child: const Text('CANCEL'),
            ),
            ElevatedButton(
              onPressed: isSaving
                  ? null
                  : () async {
                      final name = nameCtrl.text.trim();
                      var phone = phoneCtrl.text.trim();
                      final rel = relCtrl.text.trim();

                      if (name.isEmpty || phone.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter name and phone number')),
                        );
                        return;
                      }

                      if (!phone.startsWith('+')) {
                        if (phone.length == 10) {
                          phone = '+91$phone';
                        } else {
                          phone = '+$phone';
                        }
                      }

                      setDialogState(() => isSaving = true);
                      try {
                        final api = ref.read(apiClientProvider);
                        await api.createEmergencyContact(
                          name: name,
                          phone: phone,
                          relationship: rel.isEmpty ? 'Family' : rel,
                        );
                        if (mounted) {
                          Navigator.of(ctx).pop();
                          _loadContacts();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Emergency contact saved successfully!')),
                          );
                        }
                      } catch (e) {
                        setDialogState(() => isSaving = false);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Failed to save contact: $e')),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.midnightNavy,
                foregroundColor: Colors.white,
              ),
              child: isSaving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('SAVE'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteContact(String contactId) async {
    try {
      final api = ref.read(apiClientProvider);
      await api.deleteEmergencyContact(contactId);
      _loadContacts();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Emergency contact removed.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete contact: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.user;
    final phone = user?['phone'] ?? '+919888800001';
    final email = user?['email'] ?? 'priya.sos@example.com';

    return Scaffold(
      backgroundColor: AppColors.canvasCream,
      appBar: AppBar(
        title: const Text('Account & Safety Settings'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // User Profile Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.midnightNavy,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.person, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'SafeLink Member',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.midnightNavy,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            phone,
                            style: const TextStyle(fontSize: 13, color: AppColors.slateNeutral),
                          ),
                          Text(
                            email,
                            style: const TextStyle(fontSize: 12, color: AppColors.slateNeutral),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.emerald.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified, size: 14, color: AppColors.emerald),
                          SizedBox(width: 4),
                          Text(
                            'Verified',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.emerald,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Registered Emergency Contacts (Max 3) Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Emergency Contacts (Max 3)',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.midnightNavy,
                    ),
                  ),
                  if (_contacts.length < 3)
                    TextButton.icon(
                      onPressed: _showAddContactDialog,
                      icon: const Icon(Icons.add, size: 16, color: AppColors.brandTeal),
                      label: const Text(
                        'ADD CONTACT',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.brandTeal),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 2),
              const Text(
                'These family members receive your live tracking link via SMS & WhatsApp when you activate SOS.',
                style: TextStyle(fontSize: 12, color: AppColors.slateNeutral),
              ),
              const SizedBox(height: 12),

              if (_isLoadingContacts)
                const Center(child: CircularProgressIndicator())
              else if (_contacts.isEmpty)
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.contact_phone_outlined, size: 36, color: AppColors.slateNeutral),
                      const SizedBox(height: 8),
                      const Text(
                        'No emergency contacts added yet.',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.midnightNavy),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Add family members so they instantly receive your location link during an emergency.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: AppColors.slateNeutral),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: _showAddContactDialog,
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('ADD FIRST EMERGENCY CONTACT'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.midnightNavy,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _contacts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final c = _contacts[index];
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: AppColors.brandTeal.withOpacity(0.12),
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(
                                color: AppColors.brandTeal,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  c['name'] ?? 'Contact',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: AppColors.midnightNavy,
                                  ),
                                ),
                                Text(
                                  '${c['relationship'] ?? 'Family'} • ${c['phone'] ?? ''}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.slateNeutral,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.slateNeutral),
                            onPressed: () => _deleteContact(c['id'].toString()),
                          ),
                        ],
                      ),
                    );
                  },
                ),

              const SizedBox(height: 24),

              // Privacy & Legal Links
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.privacy_tip_outlined, color: AppColors.midnightNavy),
                      title: const Text('Privacy Policy & DPDP Rights', style: TextStyle(fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right, size: 20),
                      onTap: () {},
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.rule_folder_outlined, color: AppColors.midnightNavy),
                      title: const Text('Safety Guidelines', style: TextStyle(fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right, size: 20),
                      onTap: () {},
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.support_agent_outlined, color: AppColors.midnightNavy),
                      title: const Text('24/7 Helpline & Support', style: TextStyle(fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right, size: 20),
                      onTap: () {},
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Logout Button
              OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authControllerProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/login');
                  }
                },
                icon: const Icon(Icons.logout, color: AppColors.emergencyRed),
                label: const Text(
                  'SIGN OUT',
                  style: TextStyle(
                    color: AppColors.emergencyRed,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  side: const BorderSide(color: AppColors.emergencyRed),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
