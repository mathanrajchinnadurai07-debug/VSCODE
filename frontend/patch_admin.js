const fs = require('fs');

let c = fs.readFileSync('c:/Users/Welcome/Desktop/VSCODE/frontend/admin.html', 'utf8');

c = c.replace('<th>Status</th></tr></thead>', '<th>Status</th><th>Actions</th></tr></thead>');
c = c.replace('<th>Status</th></tr></thead>', '<th>Status</th><th>Actions</th></tr></thead>');

let modals = `<!-- Edit Seller Modal -->
<div class="modal-overlay" id="editSellerModal">
  <div class="modal-box">
    <div class="modal-header">
      <h2><i class="fas fa-edit"></i> Edit Seller</h2>
      <button class="modal-close" onclick="closeModal('editSellerModal')"><i class="fas fa-times"></i></button>
    </div>
    <form onsubmit="saveEditSeller(event)">
      <input type="hidden" id="editSellerIndex">
      <div class="form-grid">
        <div class="form-group"><label>Shop Name</label><input type="text" id="editSellerName" class="form-input" required></div>
        <div class="form-group"><label>Contact Person</label><input type="text" id="editSellerContact" class="form-input"></div>
        <div class="form-group"><label>Phone</label><input type="tel" id="editSellerPhone" class="form-input"></div>
        <div class="form-group"><label>Email</label><input type="email" id="editSellerEmail" class="form-input"></div>
        <div class="form-group"><label>Location</label><input type="text" id="editSellerLoc" class="form-input"></div>
        <div class="form-group"><label>Categories</label><input type="text" id="editSellerCat" class="form-input"></div>
        <div class="form-group"><label>Razorpay ID</label><input type="text" id="editSellerRzp" class="form-input"></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;">
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save</button>
        <button type="button" class="btn btn-outline" onclick="closeModal('editSellerModal')">Cancel</button>
      </div>
    </form>
  </div>
</div>

<!-- Edit Delivery Modal -->
<div class="modal-overlay" id="editDeliveryModal">
  <div class="modal-box">
    <div class="modal-header">
      <h2><i class="fas fa-edit"></i> Edit Partner</h2>
      <button class="modal-close" onclick="closeModal('editDeliveryModal')"><i class="fas fa-times"></i></button>
    </div>
    <form onsubmit="saveEditDeliveryPartner(event)">
      <input type="hidden" id="editDpIndex">
      <div class="form-grid">
        <div class="form-group"><label>Name</label><input type="text" id="editDpName" class="form-input" required></div>
        <div class="form-group"><label>Phone</label><input type="tel" id="editDpPhone" class="form-input"></div>
        <div class="form-group"><label>Zone / Area</label><input type="text" id="editDpZone" class="form-input"></div>
        <div class="form-group"><label>Razorpay ID</label><input type="text" id="editDpRzpId" class="form-input"></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;">
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save</button>
        <button type="button" class="btn btn-outline" onclick="closeModal('editDeliveryModal')">Cancel</button>
      </div>
    </form>
  </div>
</div>

<!-- Add Delivery Modal -->`;

c = c.replace('<!-- Add Delivery Modal -->', modals);
fs.writeFileSync('c:/Users/Welcome/Desktop/VSCODE/frontend/admin.html', Buffer.from(c, 'utf8'));
console.log('Modals injected!');
